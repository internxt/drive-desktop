#include <filesystem>
#include <windows.h>
#include "stdafx.h"
#include "napi_extract_args.h"
#include "Placeholders.h"
#include <check_hresult.h>

void convert_to_placeholder(const std::wstring &path, const std::wstring &placeholderId)
{
    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_READ_ATTRIBUTES | FILE_WRITE_ATTRIBUTES, false);

    CF_CONVERT_FLAGS convertFlags = CF_CONVERT_FLAG_MARK_IN_SYNC;
    USN convertUsn;
    OVERLAPPED overlapped = {};

    LPCVOID idStrLPCVOID = static_cast<LPCVOID>(placeholderId.c_str());
    DWORD idStrByteLength = static_cast<DWORD>(placeholderId.size() * sizeof(wchar_t));

    HRESULT hr = CfConvertToPlaceholder(fileHandle.get(), idStrLPCVOID, idStrByteLength, convertFlags, &convertUsn, &overlapped);

    if (hr != 0x8007017C) // Already a placeholder
    {
        check_hresult("CfConvertToPlaceholder", hr);
    }
}

napi_value convert_to_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, placeholderId] = napi_extract_args<std::wstring, std::wstring>(env, info);

    convert_to_placeholder(path.c_str(), placeholderId.c_str());

    return nullptr;
}
