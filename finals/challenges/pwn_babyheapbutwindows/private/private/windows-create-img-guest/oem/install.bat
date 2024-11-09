@echo off

echo Install v1
echo Install windbg
powershell -command "Add-AppxPackage -Path 'C:\OEM\windbg.msixbundle'"

echo Install mingw
powershell -command "Expand-Archive -Path 'C:\OEM\llvm-mingw-20240917-ucrt-x86_64.zip' -DestinationPath 'C:\tmp\' -Force"
move "C:\tmp\llvm-mingw-20240917-ucrt-x86_64" "C:\mingw"

echo Install chall
move "C:\OEM\chall" "C:\chall"

netsh advfirewall firewall add rule name="Allow TCP 1337" dir=in action=allow protocol=TCP localport=1337

echo NotePwn service creating
C:\chall\socat-srv.exe -install

echo Shutting down the computer
shutdown /s /t 0
