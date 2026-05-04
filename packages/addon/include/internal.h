// clang-format off

#pragma once

#include <external.h>

// All internal libraries are imported here.

#include <helpers/napi_safe_wrap.h>
#include <helpers/napi_serializers.h>

#include <helpers/async_wrapper.h>
#include <helpers/check_hresult.h>
#include <helpers/js_timestamp_to_large_integer.h>
#include <helpers/napi_extract_args.h>
#include <helpers/register_threadsafe_callback.h>

#include <virtual_drive/file_explorer/dispatch_path.h>
#include <virtual_drive/open_file_handle.h>
#include <virtual_drive/register_fetch_data_callback.h>
#include <virtual_drive/watcher/watcher_defs.h>

#include <virtual_drive/connect_sync_root.h>
#include <virtual_drive/convert_to_placeholder.h>
#include <virtual_drive/create_file_placeholder.h>
#include <virtual_drive/create_folder_placeholder.h>
#include <virtual_drive/dehydrate_file.h>
#include <virtual_drive/disconnect_sync_root.h>
#include <virtual_drive/file_explorer/get_file_explorers.h>
#include <virtual_drive/file_explorer/watch_file_explorers.h>
#include <virtual_drive/get_first_non_placeholder.h>
#include <virtual_drive/get_placeholder_state.h>
#include <virtual_drive/get_registered_sync_roots.h>
#include <virtual_drive/get_sync_root_from_path.h>
#include <virtual_drive/hydrate_file.h>
#include <virtual_drive/register_sync_root.h>
#include <virtual_drive/set_pin_state.h>
#include <virtual_drive/unregister_sync_root.h>
#include <virtual_drive/update_placeholder.h>
#include <virtual_drive/update_sync_status.h>
#include <virtual_drive/watcher/unwatch_path.h>
#include <virtual_drive/watcher/watch_path.h>
