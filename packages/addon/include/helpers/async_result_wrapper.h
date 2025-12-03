#pragma once

#include <napi_serializers.h>
#include <node_api.h>

#include <functional>
#include <memory>
#include <string>

template <typename R>
struct AsyncWorkWrapper {
    napi_async_work work;
    napi_deferred deferred;
    std::function<R()> fn;
    std::string error;
    bool success;
    R result;
};

template <typename R>
void execute_work(napi_env env, void* data)
{
    auto* asyncWork = static_cast<AsyncWorkWrapper<R>*>(data);

    try {
        asyncWork->result = asyncWork->fn();
        asyncWork->success = true;
    } catch (const std::exception& e) {
        asyncWork->error = e.what();
        asyncWork->success = false;
    } catch (...) {
        asyncWork->error = "Unknown error";
        asyncWork->success = false;
    }
}

template <typename R>
void complete_work(napi_env env, napi_status status, void* data)
{
    std::unique_ptr<AsyncWorkWrapper<R>> asyncWork(static_cast<AsyncWorkWrapper<R>*>(data));

    if (asyncWork->success) {
        napi_value result = NapiSerializer<R>::serialize(env, asyncWork->result);
        napi_resolve_deferred(env, asyncWork->deferred, result);
    } else {
        napi_value error;
        napi_create_string_utf8(env, asyncWork->error.c_str(), NAPI_AUTO_LENGTH, &error);
        napi_reject_deferred(env, asyncWork->deferred, error);
    }

    napi_delete_async_work(env, asyncWork->work);
}

template <typename Func, typename... Args>
napi_value run_result_async(napi_env env, const char* resource_name, Func&& fn, Args&&... args)
{
    using R = std::invoke_result_t<Func, Args...>;

    napi_deferred deferred;
    napi_value promise;
    napi_create_promise(env, &deferred, &promise);

    auto asyncWork = std::make_unique<AsyncWorkWrapper<R>>();
    asyncWork->deferred = deferred;

    asyncWork->fn = [fn = std::forward<Func>(fn), ... args = std::forward<Args>(args)]() mutable {
        return fn(std::forward<Args>(args)...);
    };

    napi_value resourceName;
    napi_create_string_utf8(env, resource_name, NAPI_AUTO_LENGTH, &resourceName);
    napi_create_async_work(env, nullptr, resourceName, execute_work<R>, complete_work<R>, asyncWork.get(), &asyncWork->work);
    napi_queue_async_work(env, asyncWork->work);

    asyncWork.release();

    return promise;
}
