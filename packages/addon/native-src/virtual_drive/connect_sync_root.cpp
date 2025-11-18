#include <Windows.h>
#include <SyncRoot.h>

napi_value connect_sync_root_impl(napi_env env, napi_callback_info args)
{
    size_t argc = 2;
    napi_value argv[2];
    napi_get_cb_info(env, args, &argc, argv, nullptr, nullptr);

    size_t pathLength;
    napi_get_value_string_utf16(env, argv[0], nullptr, 0, &pathLength);
    std::wstring syncRootPath(pathLength, L'\0');
    napi_get_value_string_utf16(env, argv[0], reinterpret_cast<char16_t *>(&syncRootPath[0]), pathLength + 1, nullptr);

    InputSyncCallbacks callbacks = {};

    napi_value fetchDataCallback;
    napi_get_named_property(env, argv[1], "fetchDataCallback", &fetchDataCallback);
    napi_create_reference(env, fetchDataCallback, 1, &callbacks.fetch_data_callback_ref);

    napi_value cancelFetchDataCallback;
    napi_get_named_property(env, argv[1], "cancelFetchDataCallback", &cancelFetchDataCallback);
    napi_create_reference(env, cancelFetchDataCallback, 1, &callbacks.cancel_fetch_data_callback_ref);

    SyncRoot::ConnectSyncRoot(syncRootPath.c_str(), callbacks, env);

    return nullptr;
}
