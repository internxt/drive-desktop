!macro customInstall
  nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\context-menu\register-context-menu-extension.ps1"'
  Pop $0

  ${If} $0 != 0
    DetailPrint "The Internxt Drive context-menu extension could not be registered. Continuing without context-menu integration."
  ${EndIf}
!macroend

!macro customUnInstall
  ${IfNot} ${isUpdated}
    nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\context-menu\unregister-context-menu-extension.ps1"'
    Pop $0

    ${If} $0 != 0
      DetailPrint "The Internxt Drive context-menu extension could not be completely removed."
    ${EndIf}
  ${EndIf}
!macroend

!macro requestAppShutdown
  DetailPrint "Asking Internxt Drive to close."
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -Command "$$filter='Name=''${APP_EXECUTABLE_FILENAME}'''; $$running=@(Get-CimInstance Win32_Process -Filter $$filter); if ($$running.Count -gt 0) { Start-Process -FilePath $$running[0].Path -ArgumentList '--quit'; $$deadline=(Get-Date).AddSeconds(30); while (@(Get-CimInstance Win32_Process -Filter $$filter).Count -gt 0 -and (Get-Date) -lt $$deadline) { Start-Sleep -Milliseconds 250 } }"`
  Pop $0
!macroend

!macro customInit
  !insertmacro requestAppShutdown
!macroend

!macro customUnInit
  !insertmacro requestAppShutdown
!macroend
