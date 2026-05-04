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
        "src/main.cpp"
      ],
      "include_dirs": [
        "include",
        "include/helpers",
        "include/virtual_drive",
        "include/virtual_drive/file_explorer",
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