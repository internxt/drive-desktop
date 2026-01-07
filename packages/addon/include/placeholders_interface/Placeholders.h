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

        napi_value uuid;
        napi_create_string_utf8(env, fileState.uuid.c_str(), NAPI_AUTO_LENGTH, &uuid);
        napi_set_named_property(env, obj, "uuid", uuid);

        napi_value placeholderId;
        napi_create_string_utf8(env, fileState.placeholderId.c_str(), NAPI_AUTO_LENGTH, &placeholderId);
        napi_set_named_property(env, obj, "placeholderId", placeholderId);

        napi_value pinState;
        napi_create_uint32(env, static_cast<uint32_t>(fileState.pinState), &pinState);
        napi_set_named_property(env, obj, "pinState", pinState);

        napi_value inSyncState;
        napi_create_uint32(env, static_cast<uint32_t>(fileState.inSyncState), &inSyncState);
        napi_set_named_property(env, obj, "inSyncState", inSyncState);

        napi_value onDiskSize;
        napi_create_int64(env, fileState.onDiskSize, &onDiskSize);
        napi_set_named_property(env, obj, "onDiskSize", onDiskSize);

        return obj;
    }
};

class Placeholders
{
   public:
    static winrt::file_handle OpenFileHandle(const std::wstring& path, DWORD accessRights, bool openAsPlaceholder);
    static FileState GetPlaceholderInfo(const std::wstring& path);
};