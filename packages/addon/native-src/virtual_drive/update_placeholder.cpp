#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>

void update_placeholder(const std::wstring& path, const std::wstring& placeholderId, int64_t size)
{
    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    CF_FS_METADATA fsMetadata = {};
    fsMetadata.FileSize.QuadPart = size;

    check_hresult(
        "CfUpdatePlaceholder",
        CfUpdatePlaceholder(
            fileHandle.get(),
            &fsMetadata,
            placeholderId.c_str(),
            static_cast<DWORD>(placeholderId.size() * sizeof(wchar_t)),
            nullptr,
            0,
            CF_UPDATE_FLAG_DEHYDRATE | CF_UPDATE_FLAG_MARK_IN_SYNC,
            nullptr,
            nullptr));
}

napi_value update_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, placeholderId, size] = napi_extract_args<std::wstring, std::wstring, int64_t>(env, info);

    return run_async(env, "UpdatePlaceholderAsync", update_placeholder, std::move(path), std::move(placeholderId), size);
}
