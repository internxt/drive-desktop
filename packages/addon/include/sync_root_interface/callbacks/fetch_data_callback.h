#pragma once

#include <Placeholders.h>
#include <external.h>
#include <napi_extract_args.h>
#include <napi_safe_wrap.h>
#include <propkey.h>
#include <propvarutil.h>

#define FIELD_SIZE(type, field) (sizeof(((type*)nullptr)->field))

#define CF_SIZE_OF_OP_PARAM(field) (FIELD_OFFSET(CF_OPERATION_PARAMETERS, field) + FIELD_SIZE(CF_OPERATION_PARAMETERS, field))

struct TransferContext {
    CF_CONNECTION_KEY connectionKey;
    CF_TRANSFER_KEY transferKey;

    LARGE_INTEGER fileSize;
    LARGE_INTEGER requiredLength;
    LARGE_INTEGER requiredOffset;
    std::wstring path;

    bool ready = false;

    std::mutex mtx;
    std::condition_variable cv;
};

napi_threadsafe_function g_fetch_data_threadsafe_callback = nullptr;

inline HRESULT transfer_data(
    _In_ CF_CONNECTION_KEY connectionKey,
    _In_ LARGE_INTEGER transferKey,
    _In_reads_bytes_opt_(length.QuadPart) LPCVOID transferData,
    _In_ LARGE_INTEGER startingOffset,
    _In_ LARGE_INTEGER length,
    _In_ NTSTATUS completionStatus)
{
    CF_OPERATION_INFO opInfo = {0};
    opInfo.StructSize = sizeof(opInfo);
    opInfo.Type = CF_OPERATION_TYPE_TRANSFER_DATA;
    opInfo.ConnectionKey = connectionKey;
    opInfo.TransferKey = transferKey;

    CF_OPERATION_PARAMETERS opParams = {0};
    opParams.ParamSize = CF_SIZE_OF_OP_PARAM(TransferData);
    opParams.TransferData.CompletionStatus = completionStatus;
    opParams.TransferData.Buffer = transferData;
    opParams.TransferData.Offset = startingOffset;
    opParams.TransferData.Length = length;

    return CfExecute(&opInfo, &opParams);
}

inline napi_value response_callback_fn_fetch_data(napi_env env, napi_callback_info info)
{
    size_t argc = 2;
    std::array<napi_value, 2> args;

    TransferContext* ctx = nullptr;
    napi_get_cb_info(env, info, &argc, args.data(), nullptr, reinterpret_cast<void**>(&ctx));

    try {
        void* data;
        size_t length;
        napi_get_buffer_info(env, args[0], &data, &length);

        int64_t offset;
        napi_get_value_int64(env, args[1], &offset);

        LARGE_INTEGER startingOffset;
        LARGE_INTEGER chunkSize;
        startingOffset.QuadPart = offset;
        chunkSize.QuadPart = length;

        HRESULT hr = transfer_data(ctx->connectionKey, ctx->transferKey, data, startingOffset, chunkSize, STATUS_SUCCESS);

        if (FAILED(hr)) {
            transfer_data(ctx->connectionKey, ctx->transferKey, nullptr, ctx->requiredOffset, ctx->requiredLength, STATUS_UNSUCCESSFUL);
            check_hresult("transfer_data", hr);
        }

        size_t completed = offset + length;

        winrt::com_ptr<IShellItem2> shellItem;
        winrt::com_ptr<IPropertyStore> propStoreVolatile;

        check_hresult(
            "SHCreateItemFromParsingName",
            SHCreateItemFromParsingName(ctx->path.c_str(), nullptr, __uuidof(shellItem), shellItem.put_void()));

        check_hresult(
            "shellItem->GetPropertyStore",
            shellItem->GetPropertyStore(
                GETPROPERTYSTOREFLAGS::GPS_READWRITE | GETPROPERTYSTOREFLAGS::GPS_VOLATILEPROPERTIESONLY,
                __uuidof(propStoreVolatile),
                propStoreVolatile.put_void()));

        if (completed < ctx->fileSize.QuadPart) {
            PROPVARIANT pvProgress;
            PROPVARIANT pvStatus;
            std::array<UINT64, 2> values = {completed, ctx->fileSize.QuadPart};

            InitPropVariantFromUInt64Vector(values.data(), values.size(), &pvProgress);
            InitPropVariantFromUInt32(SYNC_TRANSFER_STATUS::STS_TRANSFERRING, &pvStatus);

            propStoreVolatile->SetValue(PKEY_StorageProviderTransferProgress, pvProgress);
            propStoreVolatile->SetValue(PKEY_SyncTransferStatus, pvStatus);
            propStoreVolatile->Commit();

            PropVariantClear(&pvProgress);
        } else {
            wprintf(L"Fetch data finished\n");

            auto fileHandle = Placeholders::OpenFileHandle(ctx->path, FILE_WRITE_ATTRIBUTES, true);
            CfSetPinState(fileHandle.get(), CF_PIN_STATE_PINNED, CF_SET_PIN_FLAG_NONE, nullptr);

            {
                std::scoped_lock lock(ctx->mtx);
                ctx->ready = true;
            }

            ctx->cv.notify_one();
        }
    } catch (...) {
        wprintf(L"Fetch data exception\n");

        {
            std::scoped_lock lock(ctx->mtx);
            ctx->ready = true;
        }

        ctx->cv.notify_one();

        throw;
    }

    return nullptr;
}

inline napi_value response_callback_fn_fetch_data_wrapper(napi_env env, napi_callback_info info)
{
    return NAPI_SAFE_WRAP(env, info, response_callback_fn_fetch_data);
}

inline void notify_fetch_data_call(napi_env env, napi_value js_callback, void*, void* data)
{
    TransferContext* ctx = static_cast<TransferContext*>(data);

    napi_value js_connection_key;
    napi_create_bigint_int64(env, ctx->connectionKey.Internal, &js_connection_key);

    napi_value js_path;
    napi_create_string_utf16(env, (char16_t*)ctx->path.c_str(), ctx->path.length(), &js_path);

    napi_value js_callback_fn;
    napi_create_function(env, "callback", NAPI_AUTO_LENGTH, response_callback_fn_fetch_data_wrapper, ctx, &js_callback_fn);

    std::array<napi_value, 3> js_args = {js_connection_key, js_path, js_callback_fn};

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, js_callback, js_args.size(), js_args.data(), nullptr);
}

inline void CALLBACK fetch_data_callback_wrapper(_In_ CONST CF_CALLBACK_INFO* callbackInfo, _In_ CONST CF_CALLBACK_PARAMETERS* callbackParameters)
{
    wprintf(L"ConnectionKey: %lld, TransferKey: %lld\n",
            std::bit_cast<long long>(callbackInfo->ConnectionKey),
            callbackInfo->TransferKey.QuadPart);

    auto ctx = std::make_shared<TransferContext>();
    ctx->connectionKey = callbackInfo->ConnectionKey;
    ctx->transferKey = callbackInfo->TransferKey;
    ctx->fileSize = callbackInfo->FileSize;
    ctx->requiredLength = callbackParameters->FetchData.RequiredLength;
    ctx->requiredOffset = callbackParameters->FetchData.RequiredFileOffset;
    ctx->path = std::wstring(callbackInfo->VolumeDosName) + callbackInfo->NormalizedPath;

    wprintf(L"Fetch data path: %s\n", ctx->path.c_str());

    napi_call_threadsafe_function(g_fetch_data_threadsafe_callback, ctx.get(), napi_tsfn_blocking);

    {
        std::unique_lock<std::mutex> lock(ctx->mtx);
        ctx->cv.wait(lock, [&ctx]() { return ctx->ready; });
    }

    wprintf(L"Remove transfer context\n");
}

inline void registerFetchDataCallback(napi_env env, napi_value callback)
{
    g_fetch_data_threadsafe_callback = registerThreadsafeCallback("FetchDataCallback", env, callback, notify_fetch_data_call);
}
