#pragma once

inline void convert_to_placeholder(const std::wstring& path, const std::wstring& placeholderId, bool markInSync)
{
    auto fileHandle = openFileHandle(path, FILE_READ_ATTRIBUTES | FILE_WRITE_ATTRIBUTES, false);

    LPCVOID fileIdentity = static_cast<LPCVOID>(placeholderId.c_str());
    DWORD fileIdentityLength = static_cast<DWORD>(placeholderId.size() * sizeof(wchar_t));

    HRESULT hr = CfConvertToPlaceholder(
        fileHandle.get(),
        fileIdentity,
        fileIdentityLength,
        markInSync ? CF_CONVERT_FLAG_MARK_IN_SYNC : CF_CONVERT_FLAG_NONE,
        nullptr,
        nullptr);

    if (hr != 0x8007017C)  // Already a placeholder
    {
        check_hresult("CfConvertToPlaceholder", hr);
    }
}

inline napi_value convert_to_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, placeholderId, markInSync] = napi_extract_args<std::wstring, std::wstring, bool>(env, info);

    return run_async(env, "ConvertToPlaceholderAsync", convert_to_placeholder, std::move(path), std::move(placeholderId), markInSync);
}

inline napi_value ConvertToPlaceholderWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, convert_to_placeholder_wrapper);
}
