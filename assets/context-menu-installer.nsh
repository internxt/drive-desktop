!macro customInstall
  nsExec::ExecToLog '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoLogo -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\context-menu\register-context-menu-extension.ps1"'
  Pop $0

  ${If} $0 != 0
    MessageBox MB_ICONSTOP "The Internxt Drive context-menu extension could not be registered."
    Abort
  ${EndIf}
!macroend
