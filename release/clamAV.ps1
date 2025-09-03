Invoke-WebRequest -Uri "https://www.clamav.net/downloads/production/clamav-1.4.3.win.x64.zip" -OutFile "clamAV.zip"

Expand-Archive -Path "clamAV.zip" -DestinationPath "clamAV_temp" -Force
$folder = Get-ChildItem "clamAV_temp" | Where-Object { $_.PSIsContainer } | Select-Object -First 1
New-Item -ItemType Directory -Path "clamAV" -Force | Out-Null
Get-ChildItem $folder.FullName | ForEach-Object { Move-Item $_.FullName "clamAV" -Force }

Remove-Item "clamAV_temp" -Recurse -Force
Remove-Item "clamAV.zip"

clamAV\freshclam.exe
