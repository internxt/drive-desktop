#pragma once

inline bool isCloudReparseTag(DWORD tag)
{
    return (tag & 0xFFFF00FF) == IO_REPARSE_TAG_CLOUD;
}

// Returns empty string if all items are placeholders, or the name of the first non-placeholder found.
inline std::wstring getFirstNonPlaceholder(const std::wstring& parentPath)
{
    WIN32_FIND_DATAW fd;
    HANDLE h = FindFirstFileExW(
        (parentPath + L"\\*").c_str(),
        FindExInfoBasic,
        &fd,
        FindExSearchNameMatch,
        nullptr,
        FIND_FIRST_EX_LARGE_FETCH);

    if (h == INVALID_HANDLE_VALUE) return L"";

    std::wstring offender;
    do {
        if (fd.cFileName[0] == L'.' &&
            (fd.cFileName[1] == L'\0' || (fd.cFileName[1] == L'.' && fd.cFileName[2] == L'\0')))
            continue;

        bool isPlaceholder = (fd.dwFileAttributes & FILE_ATTRIBUTE_REPARSE_POINT) != 0 &&
                             isCloudReparseTag(fd.dwReserved0);

        if (!isPlaceholder) {
            offender = fd.cFileName;
            break;
        }

        if (fd.dwFileAttributes & FILE_ATTRIBUTE_DIRECTORY) {
            offender = getFirstNonPlaceholder(parentPath + L"\\" + fd.cFileName);
            if (!offender.empty()) break;
        }
    } while (FindNextFileW(h, &fd));

    FindClose(h);
    return offender;
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
