#pragma once

#include <napi_serializers.h>
#include <stdafx.h>

#include <string>
#include <vector>

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

class Placeholders
{
   public:
    static winrt::file_handle OpenFileHandle(const std::wstring& path, DWORD accessRights, bool openAsPlaceholder);
    static FileState GetPlaceholderInfo(const std::wstring& path);
};