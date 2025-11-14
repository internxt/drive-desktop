#pragma once
#include <SDKDDKVer.h>

#ifndef NTDDI_WIN10_NI
#error This sample requires the Windows SDK version 10.0.22598.0 or higher.
#endif

#include <stdio.h>
#include <tchar.h>
#include <ntstatus.h>
#define WIN32_NO_STATUS
#include <Unknwn.h>
#include <winrt/base.h>
#include <shlwapi.h>
#include <pathcch.h>
#include <ShlGuid.h>
#include <ShObjIdl_core.h>
#include <ShlObj_core.h>
#include <cfapi.h>
#include <sddl.h>
#include <windows.h>
#include <winrt/windows.foundation.h>
#include <winrt/windows.foundation.collections.h>
#include <winrt/windows.storage.provider.h>
#include <winrt/windows.security.cryptography.h>
#include <functional>
#include <mutex>
#include <condition_variable>
#include <node_api.h>
#include <strsafe.h>

namespace winrt
{
  using namespace Windows::Foundation;
  using namespace Windows::Storage;
  using namespace Windows::Storage::Streams;
  using namespace Windows::Storage::Provider;
  using namespace Windows::Foundation::Collections;
  using namespace Windows::Security::Cryptography;
}

#include "Utilities.h"
