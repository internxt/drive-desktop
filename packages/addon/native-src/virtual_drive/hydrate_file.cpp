#include <thread>
#include <string>
#include <Windows.h>
#include <Placeholders.h>
#include <napi_extract_args.h>
#include <check_hresult.h>
#include <filesystem>

struct AsyncWork
{
    napi_async_work work;
    napi_deferred deferred;
    std::wstring path;
    std::string error;
    bool success;
};

void hydrate_file(const std::wstring &path)
{
    if (std::filesystem::is_directory(path))
    {
        throw std::runtime_error("Cannot hydrate folder");
    }

    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    LARGE_INTEGER offset;
    offset.QuadPart = 0;
    LARGE_INTEGER length;
    GetFileSizeEx(fileHandle.get(), &length);

    check_hresult(
        "CfHydratePlaceholder",
        CfHydratePlaceholder(
            fileHandle.get(),
            offset,
            length,
            CF_HYDRATE_FLAG_NONE,
            nullptr));
}

void execute_work(napi_env env, void *data)
{
    AsyncWork *asyncWork = static_cast<AsyncWork *>(data);

    try
    {
        hydrate_file(asyncWork->path);
        asyncWork->success = true;
    }
    catch (const std::exception &e)
    {
        asyncWork->error = e.what();
        asyncWork->success = false;
    }
    catch (...)
    {
        asyncWork->error = "Unknown error";
        asyncWork->success = false;
    }
}

void complete_work(napi_env env, napi_status status, void *data)
{
    std::unique_ptr<AsyncWork> asyncWork(static_cast<AsyncWork *>(data));

    if (asyncWork->success)
    {
        napi_value result;
        napi_get_undefined(env, &result);
        napi_resolve_deferred(env, asyncWork->deferred, result);
    }
    else
    {
        napi_value error;
        napi_create_string_utf8(env, asyncWork->error.c_str(), NAPI_AUTO_LENGTH, &error);
        napi_reject_deferred(env, asyncWork->deferred, error);
    }

    napi_delete_async_work(env, asyncWork->work);
}

napi_value hydrate_file_impl(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    napi_deferred deferred;
    napi_value promise;
    napi_create_promise(env, &deferred, &promise);

    auto asyncWork = std::make_unique<AsyncWork>();
    asyncWork->deferred = deferred;
    asyncWork->path = std::move(path);

    napi_value resourceName;
    napi_create_string_utf8(env, "HydrateFileAsync", NAPI_AUTO_LENGTH, &resourceName);

    napi_create_async_work(env, nullptr, resourceName, execute_work, complete_work, asyncWork.get(), &asyncWork->work);
    napi_queue_async_work(env, asyncWork->work);

    asyncWork.release();

    return promise;
}
