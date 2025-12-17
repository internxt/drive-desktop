#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <stdafx.h>

void revert_placeholder(const std::wstring& path)
{
    auto fileHandle = Placeholders::OpenFileHandle(path, FILE_WRITE_ATTRIBUTES, false);

    check_hresult("CfRevertPlaceholder",
                  CfRevertPlaceholder(
                      fileHandle.get(),
                      CF_REVERT_FLAG_NONE,
                      nullptr));
}

napi_value revert_placeholder_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_async(env, "RevertPlaceholderAsync", revert_placeholder, std::move(path));
}
