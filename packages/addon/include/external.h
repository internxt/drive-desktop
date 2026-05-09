#pragma once

// All external libraries are imported here.

#include <ShlObj_core.h>
#include <Windows.h>
#include <atlbase.h>
#include <cfapi.h>
#include <exdispid.h>
#include <node_api.h>
#include <ntstatus.h>
#include <propkey.h>
#include <propvarutil.h>
#include <winrt/windows.foundation.collections.h>
#include <winrt/windows.foundation.h>
#include <winrt/windows.storage.provider.h>

#include <filesystem>
#include <functional>
#include <mutex>
#include <set>
#include <string>

namespace winrt
{
using namespace Windows::Foundation;
using namespace Windows::Storage;
using namespace Windows::Storage::Provider;
using namespace Windows::Foundation::Collections;
}  // namespace winrt