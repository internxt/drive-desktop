#include <windows.h>
#include <napi_extract_args.h>
#include <stdafx.h>
#include <Placeholders.h>
#include <check_hresult.h>
#include <filesystem>

napi_value dehydrate_file(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    if (std::filesystem::is_directory(path))
    {
        throw std::runtime_error("Cannot dehydrate folder");
    }

    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    LARGE_INTEGER offset;
    offset.QuadPart = 0;
    LARGE_INTEGER length;
    GetFileSizeEx(fileHandle.get(), &length);

    check_hresult(
        "CfDehydratePlaceholder",
        CfDehydratePlaceholder(
            fileHandle.get(),
            offset,
            length,
            CF_DEHYDRATE_FLAG_NONE,
            nullptr));

    return nullptr;
}
