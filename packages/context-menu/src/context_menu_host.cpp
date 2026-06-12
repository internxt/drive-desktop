#include <windows.h>

// A sparse MSIX requires an application executable in its external location.
// Explorer executes the COM DLL, not this host; context-menu clicks are still
// forwarded directly to Electron through the named pipe.
int WINAPI wWinMain(HINSTANCE, HINSTANCE, PWSTR, int)
{
    return 0;
}
