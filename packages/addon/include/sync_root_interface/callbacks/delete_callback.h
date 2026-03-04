#pragma once

#include <external.h>

#define FIELD_SIZE(type, field) (sizeof(((type*)nullptr)->field))

#define CF_SIZE_OF_OP_PARAM(field) (FIELD_OFFSET(CF_OPERATION_PARAMETERS, field) + FIELD_SIZE(CF_OPERATION_PARAMETERS, field))

struct DeleteContext {
    CF_CONNECTION_KEY connectionKey;
    CF_TRANSFER_KEY transferKey;

    std::wstring path;
    bool isDirectory;
};

napi_threadsafe_function threadsafeDeleteCallback = nullptr;

inline void notifyDeleteCallback(napi_env env, napi_value jsCallback, void*, void* data)
{
    auto* ctx = static_cast<DeleteContext*>(data);

    napi_value jsConnectionKey;
    napi_create_bigint_int64(env, ctx->connectionKey.Internal, &jsConnectionKey);

    napi_value jsPath;
    napi_create_string_utf16(env, (char16_t*)ctx->path.c_str(), ctx->path.length(), &jsPath);

    napi_value jsIsDirectory;
    napi_get_boolean(env, ctx->isDirectory, &jsIsDirectory);

    std::array<napi_value, 3> jsArgs = {jsConnectionKey, jsPath, jsIsDirectory};

    napi_value undefined;
    napi_get_undefined(env, &undefined);
    napi_call_function(env, undefined, jsCallback, jsArgs.size(), jsArgs.data(), nullptr);

    delete ctx;
}

inline void CALLBACK deleteCallbackWrapper(_In_ CONST CF_CALLBACK_INFO* callbackInfo, _In_ CONST CF_CALLBACK_PARAMETERS* callbackParameters)
{
    auto* ctx = new DeleteContext();
    ctx->connectionKey = callbackInfo->ConnectionKey;
    ctx->transferKey = callbackInfo->TransferKey;
    ctx->path = std::wstring(callbackInfo->VolumeDosName) + callbackInfo->NormalizedPath;
    ctx->isDirectory = callbackParameters->Delete.Flags & CF_CALLBACK_DELETE_FLAG_IS_DIRECTORY;

    napi_call_threadsafe_function(threadsafeDeleteCallback, ctx, napi_tsfn_blocking);

    CF_OPERATION_INFO opInfo = {0};
    opInfo.StructSize = sizeof(opInfo);
    opInfo.Type = CF_OPERATION_TYPE_ACK_DELETE;
    opInfo.ConnectionKey = callbackInfo->ConnectionKey;
    opInfo.TransferKey = callbackInfo->TransferKey;
    opInfo.RequestKey = callbackInfo->RequestKey;

    CF_OPERATION_PARAMETERS opParams = {0};
    opParams.ParamSize = CF_SIZE_OF_OP_PARAM(AckDelete);
    opParams.AckDelete.Flags = CF_OPERATION_ACK_DELETE_FLAG_NONE;
    opParams.AckDelete.CompletionStatus = STATUS_SUCCESS;

    check_hresult("CfExecute", CfExecute(&opInfo, &opParams));
}

inline void registerDeleteCallback(napi_env env, napi_value callback)
{
    threadsafeDeleteCallback = registerThreadsafeCallback("DeleteCallback", env, callback, notifyDeleteCallback);
}
