#include "stdafx.h"
#include <Callbacks.h>
#include <cfapi.h>
#include <condition_variable>
#include <iostream>
#include <mutex>
#include <filesystem>
#include <TransferContext.h>

napi_threadsafe_function g_cancel_fetch_data_threadsafe_callback = nullptr;

void notify_cancel_fetch_data_call(napi_env env, napi_value js_callback, void *context, void *data)
{
    std::unique_ptr<std::wstring> path(static_cast<std::wstring *>(data));

    napi_value js_path;
    napi_create_string_utf16(env, (char16_t *)path->c_str(), path->length(), &js_path);

    std::array<napi_value, 1> js_args = {js_path};

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, js_callback, js_args.size(), js_args.data(), nullptr);
}

void CALLBACK cancel_fetch_data_callback_wrapper(_In_ CONST CF_CALLBACK_INFO *callbackInfo, _In_ CONST CF_CALLBACK_PARAMETERS *)
{
    wprintf(L"ConnectionKey: %lld, TransferKey: %lld\n",
            std::bit_cast<long long>(callbackInfo->ConnectionKey),
            callbackInfo->TransferKey.QuadPart);

    auto ctx = GetTransferContext(callbackInfo->TransferKey);

    if (!ctx)
        return;

    auto path = std::make_unique<std::wstring>(ctx->path);
    wprintf(L"Cancel fetch data path: %s\n", path->c_str());

    {
        std::scoped_lock lock(ctx->mtx);
        ctx->ready = true;
    }

    ctx->cv.notify_one();

    napi_call_threadsafe_function(g_cancel_fetch_data_threadsafe_callback, path.release(), napi_tsfn_blocking);
}

void register_threadsafe_cancel_fetch_data_callback(const std::string &resource_name, napi_env env, InputSyncCallbacks input)
{
    std::u16string converted_resource_name(resource_name.begin(), resource_name.end());

    napi_value resource_name_value;
    napi_create_string_utf16(env, converted_resource_name.c_str(), NAPI_AUTO_LENGTH, &resource_name_value);

    napi_value cancel_fetch_data_value;
    napi_get_reference_value(env, input.cancel_fetch_data_callback_ref, &cancel_fetch_data_value);

    napi_threadsafe_function tsfn_cancel_fetch_data;
    napi_create_threadsafe_function(
        env,
        cancel_fetch_data_value,
        nullptr,
        resource_name_value,
        0,
        1,
        nullptr,
        nullptr,
        nullptr,
        notify_cancel_fetch_data_call,
        &tsfn_cancel_fetch_data);

    g_cancel_fetch_data_threadsafe_callback = tsfn_cancel_fetch_data;
}
