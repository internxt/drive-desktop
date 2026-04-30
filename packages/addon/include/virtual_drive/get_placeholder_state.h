#pragma once

struct FileState {
    std::string uuid;
    std::string placeholderId;
    CF_PIN_STATE pinState;
    CF_IN_SYNC_STATE inSyncState;
    LONGLONG onDiskSize;
};

template <>
struct NapiSerializer<FileState> {
    static napi_value serialize(napi_env env, const FileState& fileState)
    {
        napi_value obj;
        napi_create_object(env, &obj);

        napiSetString(env, obj, "uuid", fileState.uuid);
        napiSetString(env, obj, "placeholderId", fileState.placeholderId);
        napiSetUint32(env, obj, "pinState", static_cast<uint32_t>(fileState.pinState));
        napiSetUint32(env, obj, "inSyncState", static_cast<uint32_t>(fileState.inSyncState));
        napiSetInt64(env, obj, "onDiskSize", fileState.onDiskSize);

        return obj;
    }
};

inline FileState getPlaceholderInfo(const std::wstring& path)
{
    auto fileHandle = openFileHandle(path, FILE_READ_ATTRIBUTES, true);

    constexpr DWORD fileIdMaxLength = 400;
    constexpr DWORD infoSize = sizeof(CF_PLACEHOLDER_STANDARD_INFO) + fileIdMaxLength;

    std::vector<BYTE> buffer(infoSize);
    auto* info = reinterpret_cast<CF_PLACEHOLDER_STANDARD_INFO*>(buffer.data());

    check_hresult(
        "CfGetPlaceholderInfo",
        CfGetPlaceholderInfo(
            fileHandle.get(),
            CF_PLACEHOLDER_INFO_STANDARD,
            info,
            infoSize,
            nullptr));

    std::string placeholderId(reinterpret_cast<const char*>(info->FileIdentity), info->FileIdentityLength);

    placeholderId.erase(std::remove(placeholderId.begin(), placeholderId.end(), '\0'), placeholderId.end());

    FileState result;
    result.uuid = placeholderId.substr(placeholderId.find(':') + 1);
    result.placeholderId = placeholderId;
    result.pinState = info->PinState;
    result.inSyncState = info->InSyncState;
    result.onDiskSize = info->OnDiskDataSize.QuadPart;
    return result;
}

napi_value get_placeholder_state_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "GetPlaceholderInfoAsync", getPlaceholderInfo, std::move(path));
}

inline napi_value GetPlaceholderStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, get_placeholder_state_wrapper);
}
