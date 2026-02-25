#pragma once

#include <Callbacks.h>
#include <external.h>

napi_value connectSyncRoot(napi_env env, napi_callback_info info)
{
    auto [syncRootPath, deleteCallback, fetchDataCallback] =
        napi_extract_args<std::wstring, napi_value, napi_value>(env, info);

    registerDeleteCallback(env, deleteCallback);
    register_threadsafe_fetch_data_callback("FetchDataThreadSafe", env, fetchDataCallback);

    CF_CALLBACK_REGISTRATION callbackTable[] = {
        {CF_CALLBACK_TYPE_FETCH_DATA, fetch_data_callback_wrapper},
        {CF_CALLBACK_TYPE_NOTIFY_DELETE, deleteCallbackWrapper},
        CF_CALLBACK_REGISTRATION_END};

    CF_CONNECTION_KEY connectionKey;

    check_hresult(
        "CfConnectSyncRoot",
        CfConnectSyncRoot(
            syncRootPath.c_str(),
            callbackTable,
            nullptr,
            CF_CONNECT_FLAG_REQUIRE_PROCESS_INFO | CF_CONNECT_FLAG_REQUIRE_FULL_FILE_PATH,
            &connectionKey));

    napi_value result;
    napi_create_bigint_int64(env, connectionKey.Internal, &result);
    return result;
}

inline napi_value ConnectSyncRootWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, connectSyncRoot);
}
