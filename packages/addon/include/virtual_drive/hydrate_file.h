#pragma once

#include <external.h>

inline void hydrate_file(const std::wstring& path)
{
    if (std::filesystem::is_directory(path)) {
        throw std::runtime_error("Cannot hydrate folder");
    }

    auto fileHandle = openFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    LARGE_INTEGER offset;
    offset.QuadPart = 0;
    LARGE_INTEGER length;
    GetFileSizeEx(fileHandle.get(), &length);

    check_hresult(
        "CfHydratePlaceholder",
        CfHydratePlaceholder(
            fileHandle.get(),
            offset,
            length,
            CF_HYDRATE_FLAG_NONE,
            nullptr));
}

inline napi_value hydrate_file_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "HydrateFileAsync", hydrate_file, std::move(path));
}

inline napi_value HydrateFileWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, hydrate_file_wrapper);
}
