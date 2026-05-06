#pragma once
#include <SDKDDKVer.h>

#ifndef NTDDI_WIN10_NI
#error This sample requires the Windows SDK version 10.0.22598.0 or higher.
#endif

#include <ntstatus.h>
#include <stdio.h>
#include <tchar.h>
#define WIN32_NO_STATUS
#include <ShObjIdl_core.h>
#include <ShlGuid.h>
#include <ShlObj_core.h>
#include <Unknwn.h>
#include <cfapi.h>
#include <node_api.h>
#include <pathcch.h>
#include <sddl.h>
#include <shlwapi.h>
#include <strsafe.h>
#include <windows.h>
#include <winrt/base.h>
#include <winrt/windows.foundation.collections.h>
#include <winrt/windows.foundation.h>
#include <winrt/windows.security.cryptography.h>
#include <winrt/windows.storage.provider.h>

#include <condition_variable>
#include <functional>
#include <mutex>

namespace winrt
{
using namespace Windows::Foundation;
using namespace Windows::Storage;
using namespace Windows::Storage::Streams;
using namespace Windows::Storage::Provider;
using namespace Windows::Foundation::Collections;
using namespace Windows::Security::Cryptography;
}  // namespace winrt
