{
  "targets": [
    {
      "msvs_windows_target_platform_version": "10.0.22621.0",
      "target_name": "addon",
      "msvs_settings": {
        "VCCLCompilerTool": {
          "ExceptionHandling": "1",
          "AdditionalOptions": [
            "-std:c++latest",
            "/EHsc",
            "/await"
          ]
        }
      },
      "sources": [
        "native-src/main.cpp",
        "native-src/placeholders_interface/Planceholders.cpp",
        "native-src/sync_root_interface/callbacks/CancelFetchData/CancelFetchDataCallback.cpp",
        "native-src/sync_root_interface/callbacks/FetchData/FetchData.cpp",
        "native-src/sync_root_interface/callbacks/FetchData/TransferContext.cpp",
        "native-src/virtual_drive/Wrappers.cpp",
        "native-src/virtual_drive/connect_sync_root.cpp",
        "native-src/virtual_drive/convert_to_placeholder.cpp",
        "native-src/virtual_drive/create_file_placeholder.cpp",
        "native-src/virtual_drive/create_folder_placeholder.cpp",
        "native-src/virtual_drive/dehydrate_file.cpp",
        "native-src/virtual_drive/disconnect_sync_root.cpp",
        "native-src/virtual_drive/get_placeholder_state/get_placeholder_state_wrapper.cpp",
        "native-src/virtual_drive/get_registered_sync_roots/get_registered_sync_roots.cpp",
        "native-src/virtual_drive/get_registered_sync_roots/get_registered_sync_roots_wrapper.cpp",
        "native-src/virtual_drive/hydrate_file.cpp",
        "native-src/virtual_drive/register_sync_root/register_sync_root.cpp",
        "native-src/virtual_drive/set_pin_state.cpp",
        "native-src/virtual_drive/unregister_sync_root_wrapper.cpp",
        "native-src/virtual_drive/update_placeholder.cpp",
        "native-src/virtual_drive/update_sync_status/update_sync_status_wrapper.cpp"
      ],
      "include_dirs": [
        "include",
        "include/helpers",
        "include/placeholders_interface",
        "include/sync_root_interface",
        "include/sync_root_interface/callbacks",
        "include/virtual_drive",
        "include/virtual_drive/get_placeholder_state",
        "include/virtual_drive/get_registered_sync_roots",
        "include/virtual_drive/register_sync_root",
        "include/virtual_drive/update_sync_status",
        "include/virtual_drive/watcher"
      ],
      "libraries": [
        "-lCldApi.lib",
        "-lPropsys.lib"
      ]
    },
    {
      "target_name": "after_build",
      "type": "none",
      "dependencies": [
        "addon"
      ],
      "copies": [
        {
          "destination": "dist",
          "files": [
            "<(PRODUCT_DIR)/addon.node"
          ]
        }
      ]
    }
  ]
}