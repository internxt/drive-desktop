#pragma once

#include <node_api.h>
#include <stdafx.h>

void register_threadsafe_fetch_data_callback(const std::string &resource_name, napi_env env, napi_value callback);
void CALLBACK fetch_data_callback_wrapper(_In_ CONST CF_CALLBACK_INFO *callbackInfo, _In_ CONST CF_CALLBACK_PARAMETERS *callbackParameters);

void register_threadsafe_cancel_fetch_data_callback(const std::string &resource_name, napi_env env, napi_value callback);
void CALLBACK cancel_fetch_data_callback_wrapper(_In_ CONST CF_CALLBACK_INFO *callbackInfo, _In_ CONST CF_CALLBACK_PARAMETERS *callbackParameters);
