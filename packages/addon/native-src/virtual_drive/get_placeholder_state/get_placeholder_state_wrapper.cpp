#include <Placeholders.h>
#include <async_result_wrapper.h>
#include <napi_extract_args.h>
#include <windows.h>

napi_value get_placeholder_state_wrapper(napi_env env, napi_callback_info info)
{
    auto [path] = napi_extract_args<std::wstring>(env, info);

    return run_result_async(env, "GetPlaceholderInfoAsync", Placeholders::GetPlaceholderInfo, std::move(path));
}
