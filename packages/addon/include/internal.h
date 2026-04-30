// clang-format off

#pragma once

#include <external.h>

#include <helpers/check_hresult.h>
#include <helpers/napi_extract_args.h>
#include <helpers/napi_safe_wrap.h>
#include <helpers/napi_serializers.h>
#include <helpers/register_threadsafe_callback.h>
#include <helpers/async_wrapper.h>

#include <virtual_drive/open_file_handle.h>

#include <sync_root_interface/callbacks/fetch_data_callback.h>

#include <virtual_drive/connect_sync_root.h>
#include <virtual_drive/convert_to_placeholder.h>
#include <virtual_drive/create_file_placeholder.h>
#include <virtual_drive/create_folder_placeholder.h>
#include <virtual_drive/dehydrate_file.h>
#include <virtual_drive/disconnect_sync_root.h>
#include <virtual_drive/get_sync_root_from_path.h>
#include <virtual_drive/hydrate_file.h>
#include <virtual_drive/update_sync_status.h>
#include <virtual_drive/watcher/watcher_defs.h>
#include <virtual_drive/watcher/unwatch_path.h>
#include <virtual_drive/watcher/watch_path.h>
