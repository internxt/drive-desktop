#include <Callbacks.h>
#include <Windows.h>
#include <check_hresult.h>
#include <napi_extract_args.h>

napi_value connect_sync_root_impl(napi_env env, napi_callback_info info)
{
    auto [syncRootPath, fetchDataCallback] =
        napi_extract_args<std::wstring, napi_value>(env, info);

    register_threadsafe_fetch_data_callback("FetchDataThreadSafe", env, fetchDataCallback);

    CF_CALLBACK_REGISTRATION callbackTable[] = {
        {CF_CALLBACK_TYPE_FETCH_DATA, fetch_data_callback_wrapper},
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
