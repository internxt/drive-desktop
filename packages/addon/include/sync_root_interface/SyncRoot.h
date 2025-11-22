#pragma once

#include <Callbacks.h>
#include <cfapi.h>

#include <iostream>
#include <vector>

#include "stdafx.h"

class SyncRoot
{
   public:
    static void ConnectSyncRoot(const std::wstring& syncRootPath, InputSyncCallbacks syncCallbacks, napi_env env);
    static void DisconnectSyncRoot(const std::wstring& syncRootPath);
};
