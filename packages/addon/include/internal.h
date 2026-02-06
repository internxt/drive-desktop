// clang-format off

#pragma once

#include <external.h>

#include <helpers/check_hresult.h>
#include <helpers/napi_extract_args.h>
#include <helpers/napi_safe_wrap.h>
#include <helpers/napi_serializers.h>
#include <helpers/register_threadsafe_callback.h>
#include <helpers/async_wrapper.h>

#include <virtual_drive/get_sync_root_from_path.h>
#include <virtual_drive/watcher/watcher_defs.h>
#include <virtual_drive/watcher/unwatch_path.h>
#include <virtual_drive/watcher/watch_path.h>
