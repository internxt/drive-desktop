#pragma once

#include <cfapi.h>
#include <Callbacks.h>
#include "stdafx.h"
#include <iostream>
#include <vector>

class SyncRoot
{
public:
    static void ConnectSyncRoot(const wchar_t *syncRootPath, InputSyncCallbacks syncCallbacks, napi_env env);
    static void DisconnectSyncRoot(const wchar_t *syncRootPath);
};
