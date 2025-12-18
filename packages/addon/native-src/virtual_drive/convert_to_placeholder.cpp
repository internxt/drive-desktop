#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <stdafx.h>

#include <filesystem>

void convert_to_placeholder(const std::wstring& path, const std::wstring& placeholderId)
{
    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_READ_ATTRIBUTES | FILE_WRITE_ATTRIBUTES, false);

    LPCVOID fileIdentity = static_cast<LPCVOID>(placeholderId.c_str());
    DWORD fileIdentityLength = static_cast<DWORD>(placeholderId.size() * sizeof(wchar_t));

    HRESULT hr = CfConvertToPlaceholder(
        fileHandle.get(),
        fileIdentity,
        fileIdentityLength,
        CF_CONVERT_FLAG_MARK_IN_SYNC,
        nullptr,
        nullptr);

    if (hr != 0x8007017C)  // Already a placeholder
    {
        check_hresult("CfConvertToPlaceholder", hr);
    }
}

napi_value convert_to_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, placeholderId] = napi_extract_args<std::wstring, std::wstring>(env, info);

    return run_async(env, "ConvertToPlaceholderAsync", convert_to_placeholder, std::move(path), std::move(placeholderId));
}
