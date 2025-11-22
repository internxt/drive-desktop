#pragma once

#include <stdafx.h>

#include <string>
#include <vector>

struct FileState {
    std::string placeholderId;
    CF_PIN_STATE pinState;
};

class Placeholders
{
   public:
    static winrt::file_handle OpenFileHandle(const std::wstring& path, DWORD accessRights, bool openAsPlaceholder);
    static void UpdateFileIdentity(const std::wstring& path, const std::wstring& placeholderId);
    static FileState GetPlaceholderInfo(const std::wstring& path);
};