#pragma once

#include <napi_serializers.h>
#include <stdafx.h>

#include <string>
#include <vector>

struct FileState {
    std::string placeholderId;
    CF_PIN_STATE pinState;
};

template <>
struct NapiSerializer<FileState> {
    static napi_value serialize(napi_env env, const FileState& fileState)
    {
        napi_value obj;
        napi_create_object(env, &obj);

        napi_value placeholderId;
        napi_create_string_utf8(env, fileState.placeholderId.c_str(), NAPI_AUTO_LENGTH, &placeholderId);
        napi_set_named_property(env, obj, "placeholderId", placeholderId);

        napi_value pinState;
        napi_create_uint32(env, static_cast<uint32_t>(fileState.pinState), &pinState);
        napi_set_named_property(env, obj, "pinState", pinState);

        return obj;
    }
};

class Placeholders
{
   public:
    static winrt::file_handle OpenFileHandle(const std::wstring& path, DWORD accessRights, bool openAsPlaceholder);
    static void UpdateFileIdentity(const std::wstring& path, const std::wstring& placeholderId);
    static FileState GetPlaceholderInfo(const std::wstring& path);
};