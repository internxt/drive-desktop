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
        "native-src/virtual_drive/get_placeholder_state.cpp",
        "native-src/virtual_drive/get_registered_sync_roots/get_registered_sync_roots.cpp",
        "native-src/virtual_drive/get_registered_sync_roots/get_registered_sync_roots_wrapper.cpp",
        "native-src/virtual_drive/unregister_sync_root.cpp"
      ],
      "include_dirs": [
        "include",
        "include/helpers",
        "include/placeholders_interface",
        "include/sync_root_interface",
        "include/sync_root_interface/callbacks",
        "include/virtual_drive",
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