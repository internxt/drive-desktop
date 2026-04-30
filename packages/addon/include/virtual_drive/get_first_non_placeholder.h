#pragma once

inline std::optional<std::wstring> findNonPlaceholderImpl(const std::wstring& parentPath, const std::wstring& prefix)
{
    WIN32_FIND_DATAW fd;
    HANDLE h = FindFirstFileExW(
        (parentPath + L"\\*").c_str(),
        FindExInfoBasic,
        &fd,
        FindExSearchNameMatch,
        nullptr,
        FIND_FIRST_EX_LARGE_FETCH);

    if (h == INVALID_HANDLE_VALUE) return std::nullopt;

    std::optional<std::wstring> offender;

    do {
        if (fd.cFileName[0] == L'.') {
            if (fd.cFileName[1] == L'\0' || (fd.cFileName[1] == L'.' && fd.cFileName[2] == L'\0')) {
                continue;
            }
        }

        bool isPlaceholder = (fd.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0 &&
                             (fd.dwReserved0 & 0xFFFF00FF) == IO_REPARSE_TAG_CLOUD;

        std::wstring relativePath = prefix.empty() ? fd.cFileName : prefix + L"/" + fd.cFileName;

        if (!isPlaceholder) {
            offender = relativePath;
            break;
        }

        if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            offender = findNonPlaceholderImpl(parentPath + L"\\" + fd.cFileName, relativePath);
            if (offender) break;
        }
    } while (FindNextFileW(h, &fd));

    FindClose(h);
    return offender;
}

// Returns null if all items are placeholders, or the relative POSIX path of the first non-placeholder found.
inline std::optional<std::wstring> getFirstNonPlaceholder(const std::wstring& parentPath)
{
    return findNonPlaceholderImpl(parentPath, L"");
}

inline napi_value asyncGetFirstNonPlaceholder(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "getFirstNonPlaceholder", getFirstNonPlaceholder, std::move(path));
}

inline napi_value getFirstNonPlaceholderWrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, asyncGetFirstNonPlaceholder);
}
