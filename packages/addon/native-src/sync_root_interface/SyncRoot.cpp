#include <Callbacks.h>
#include <SyncRoot.h>
#include <check_hresult.h>
#include <stdafx.h>

#include <filesystem>
#include <iostream>
#include <vector>

std::map<std::wstring, CF_CONNECTION_KEY> connectionMap;

void SyncRoot::ConnectSyncRoot(const std::wstring& syncRootPath, InputSyncCallbacks syncCallbacks, napi_env env)
{
    register_threadsafe_fetch_data_callback("FetchDataThreadSafe", env, syncCallbacks);
    register_threadsafe_cancel_fetch_data_callback("CancelFetchDataThreadSafe", env, syncCallbacks);

    CF_CALLBACK_REGISTRATION callbackTable[] = {
        {CF_CALLBACK_TYPE_FETCH_DATA, fetch_data_callback_wrapper},
        {CF_CALLBACK_TYPE_CANCEL_FETCH_DATA, cancel_fetch_data_callback_wrapper},
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

    connectionMap[syncRootPath.c_str()] = connectionKey;
}

void SyncRoot::DisconnectSyncRoot(const std::wstring& syncRootPath)
{
    auto it = connectionMap.find(syncRootPath.c_str());
    if (it != connectionMap.end()) {
        check_hresult("CfDisconnectSyncRoot", CfDisconnectSyncRoot(it->second));

        connectionMap.erase(it);
    }
}
