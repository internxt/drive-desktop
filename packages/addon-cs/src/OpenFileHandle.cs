using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.Win32.SafeHandles;
using Windows.Win32;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

internal static class FileHandleHelper
{
    public static SafeFileHandle OpenFileHandle(string path, FILE_ACCESS_RIGHTS dwDesiredAccess, bool openAsPlaceholder)
    {
        FILE_FLAGS_AND_ATTRIBUTES flags = 0;
        if (openAsPlaceholder) flags |= FILE_FLAGS_AND_ATTRIBUTES.FILE_FLAG_OPEN_REPARSE_POINT;
        if (Directory.Exists(path)) flags |= FILE_FLAGS_AND_ATTRIBUTES.FILE_FLAG_BACKUP_SEMANTICS;

        var handle = PInvoke.CreateFile(
            path,
            (uint)dwDesiredAccess,
            FILE_SHARE_MODE.FILE_SHARE_READ | FILE_SHARE_MODE.FILE_SHARE_WRITE | FILE_SHARE_MODE.FILE_SHARE_DELETE,
            null,
            FILE_CREATION_DISPOSITION.OPEN_EXISTING,
            flags,
            null);

        if (handle.IsInvalid)
            throw new Win32Exception(Marshal.GetLastWin32Error(), $"Failed to open file handle: {path}");

        return handle;
    }
}
