#pragma once

#include <Callbacks.h>

#pragma once

#include <node_api.h>
#include <iostream>
#include <CallbacksContext.h>
#include "stdafx.h"

struct InputSyncCallbacks {
    napi_ref fetch_data_callback_ref;
    napi_ref cancel_fetch_data_callback_ref;
};