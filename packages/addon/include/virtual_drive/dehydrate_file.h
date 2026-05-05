#pragma once

#include <external.h>

inline void dehydrate_file(const std::wstring& path)
{
    if (std::filesystem::is_directory(path)) {
        throw std::runtime_error("Cannot dehydrate folder");
    }

    auto fileHandle = openFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    LARGE_INTEGER offset;
    offset.QuadPart = 0;
    LARGE_INTEGER length;
    length.QuadPart = -1;

    check_hresult(
        "CfDehydratePlaceholder",
        CfDehydratePlaceholder(
            fileHandle.get(),
            offset,
            length,
            CF_DEHYDRATE_FLAG_NONE,
            nullptr));
}

inline napi_value dehydrate_file_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "DehydrateFileAsync", dehydrate_file, std::move(path));
}

inline napi_value DehydrateFileWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, dehydrate_file_wrapper);
}
