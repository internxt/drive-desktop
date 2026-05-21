using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.Win32.SafeHandles;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.CloudFilters;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

[JSExport]
public static class Addon
{
    public static Task HydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot hydrate folder");

        using var handle = OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, openAsPlaceholder: true);

        HRESULT hr = PInvoke.CfHydratePlaceholder(handle, 0, -1, CF_HYDRATE_FLAGS.CF_HYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfHydratePlaceholder failed: 0x{hr.Value:X8}");
    });

    public static Task DehydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot dehydrate folder");

        using var handle = OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, openAsPlaceholder: true);

        HRESULT hr = PInvoke.CfDehydratePlaceholder(handle, 0, -1, CF_DEHYDRATE_FLAGS.CF_DEHYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfDehydratePlaceholder failed: 0x{hr.Value:X8}");
    });

    private static SafeFileHandle OpenFileHandle(string path, FILE_ACCESS_RIGHTS dwDesiredAccess, bool openAsPlaceholder)
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
