#pragma once

#include <node_api.h>

#include <functional>
#include <memory>
#include <string>

template <typename... Args>
struct AsyncWorkWrapper {
    napi_async_work work;
    napi_deferred deferred;
    std::function<void()> fn;
    std::string error;
    bool success;
};

template <typename... Args>
void execute_work(napi_env env, void* data)
{
    auto* asyncWork = static_cast<AsyncWorkWrapper<Args...>*>(data);

    try {
        asyncWork->fn();
        asyncWork->success = true;
    } catch (const std::exception& e) {
        asyncWork->error = e.what();
        asyncWork->success = false;
    } catch (...) {
        asyncWork->error = "Unknown error";
        asyncWork->success = false;
    }
}

template <typename... Args>
void complete_work(napi_env env, napi_status status, void* data)
{
    std::unique_ptr<AsyncWorkWrapper<Args...>> asyncWork(static_cast<AsyncWorkWrapper<Args...>*>(data));

    if (asyncWork->success) {
        napi_value result;
        napi_get_undefined(env, &result);
        napi_resolve_deferred(env, asyncWork->deferred, result);
    } else {
        napi_value error;
        napi_create_string_utf8(env, asyncWork->error.c_str(), NAPI_AUTO_LENGTH, &error);
        napi_reject_deferred(env, asyncWork->deferred, error);
    }

    napi_delete_async_work(env, asyncWork->work);
}

template <typename Func, typename... Args>
napi_value run_async(napi_env env, const char* resource_name, Func&& fn, Args&&... args)
{
    napi_deferred deferred;
    napi_value promise;
    napi_create_promise(env, &deferred, &promise);

    auto asyncWork = std::make_unique<AsyncWorkWrapper<Args...>>();
    asyncWork->deferred = deferred;

    asyncWork->fn = [fn = std::forward<Func>(fn), ... args = std::forward<Args>(args)]() mutable {
        fn(std::forward<Args>(args)...);
    };

    napi_value resourceName;
    napi_create_string_utf8(env, resource_name, NAPI_AUTO_LENGTH, &resourceName);
    napi_create_async_work(env, nullptr, resourceName, execute_work<Args...>, complete_work<Args...>, asyncWork.get(), &asyncWork->work);
    napi_queue_async_work(env, asyncWork->work);

    asyncWork.release();

    return promise;
}
