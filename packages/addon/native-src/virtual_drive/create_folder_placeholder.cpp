#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <convert_to_placeholder.h>
#include <napi_extract_args.h>

#include <filesystem>

void create_folder_placeholder(const std::wstring& path, const std::wstring& placeholderId, int64_t creationTimeMs, int64_t lastWriteTimeMs)
{
    if (std::filesystem::exists(path)) {
        convert_to_placeholder(path, placeholderId);
        return;
    }

    LARGE_INTEGER creationTime = Utilities::JsTimestampToLargeInteger(creationTimeMs);
    LARGE_INTEGER lastWriteTime = Utilities::JsTimestampToLargeInteger(lastWriteTimeMs);

    std::filesystem::path fsPath(path);
    std::wstring parentPath = fsPath.parent_path().wstring();
    std::wstring name = fsPath.filename().wstring();

    CF_PLACEHOLDER_CREATE_INFO cloudEntry = {};
    cloudEntry.FileIdentity = placeholderId.c_str();
    cloudEntry.FileIdentityLength = static_cast<DWORD>((placeholderId.size() + 1) * sizeof(WCHAR));
    cloudEntry.RelativeFileName = name.c_str();
    cloudEntry.Flags = CF_PLACEHOLDER_CREATE_FLAG_DISABLE_ON_DEMAND_POPULATION | CF_PLACEHOLDER_CREATE_FLAG_MARK_IN_SYNC;
    cloudEntry.FsMetadata.BasicInfo.FileAttributes = FILE_ATTRIBUTE_DIRECTORY;
    cloudEntry.FsMetadata.BasicInfo.CreationTime = creationTime;
    cloudEntry.FsMetadata.BasicInfo.LastWriteTime = lastWriteTime;
    cloudEntry.FsMetadata.BasicInfo.LastAccessTime = lastWriteTime;

    check_hresult(
        "CfCreatePlaceholders",
        CfCreatePlaceholders(parentPath.c_str(), &cloudEntry, 1, CF_CREATE_FLAG_STOP_ON_ERROR, nullptr));
}

napi_value create_folder_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, placeholderId, creationTimeMs, lastWriteTimeMs] =
        napi_extract_args<std::wstring, std::wstring, int64_t, int64_t>(env, info);

    return run_async(env, "CreateFolderPlaceholderAsync", create_folder_placeholder,
                     std::move(path), std::move(placeholderId),
                     creationTimeMs, lastWriteTimeMs);
}
