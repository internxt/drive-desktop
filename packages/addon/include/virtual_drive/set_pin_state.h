#include <Placeholders.h>
#include <Windows.h>
#include <async_wrapper.h>
#include <check_hresult.h>
#include <napi_extract_args.h>
#include <open_file_handle.h>

void set_pin_state(const std::wstring& path, CF_PIN_STATE pinState)
{
    auto fileHandle = openFileHandle(path, FILE_WRITE_ATTRIBUTES, true);

    check_hresult(
        "CfSetPinState",
        CfSetPinState(
            fileHandle.get(),
            pinState,
            CF_SET_PIN_FLAG_NONE,
            nullptr));
}

napi_value set_pin_state_wrapper(napi_env env, napi_callback_info info)
{
    auto [path, pinState] = napi_extract_args<std::wstring, CF_PIN_STATE>(env, info);

    return run_async(env, "SetPinStateAsync", set_pin_state, std::move(path), pinState);
}

inline napi_value SetPinStateWrapper(napi_env env, napi_callback_info args)
{
    return NAPI_SAFE_WRAP(env, args, set_pin_state_wrapper);
}
