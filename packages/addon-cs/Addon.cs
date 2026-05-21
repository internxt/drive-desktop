using System.ComponentModel;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.Win32.SafeHandles;

namespace Intx.Addon;

[JSExport]
public static class Addon
{
    public static string Hello(string name) => $"Hello, {name}! From C#.";

    public static int Add(int a, int b) => a + b;

    public static string Platform() =>
        $"{RuntimeInformation.OSDescription} | .NET {Environment.Version}";

    public static Task HydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot hydrate folder");

        using var handle = OpenFileHandle(path, Native.FILE_WRITE_ATTRIBUTES, openAsPlaceholder: true);

        if (!Native.GetFileSizeEx(handle, out long length))
            throw new Win32Exception(Marshal.GetLastWin32Error(), "GetFileSizeEx failed");

        int hr = Native.CfHydratePlaceholder(handle, 0, length, Native.CF_HYDRATE_FLAG_NONE, IntPtr.Zero);
        if (hr < 0)
            throw Marshal.GetExceptionForHR(hr) ?? new Exception($"CfHydratePlaceholder failed: 0x{hr:X8}");
    });

    public static Task DehydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot dehydrate folder");

        using var handle = OpenFileHandle(path, Native.FILE_WRITE_ATTRIBUTES, openAsPlaceholder: true);

        int hr = Native.CfDehydratePlaceholder(handle, 0, -1, Native.CF_DEHYDRATE_FLAG_NONE, IntPtr.Zero);
        if (hr < 0)
            throw Marshal.GetExceptionForHR(hr) ?? new Exception($"CfDehydratePlaceholder failed: 0x{hr:X8}");
    });

    private static SafeFileHandle OpenFileHandle(string path, uint dwDesiredAccess, bool openAsPlaceholder)
    {
        uint flags = 0;
        if (openAsPlaceholder) flags |= Native.FILE_FLAG_OPEN_REPARSE_POINT;
        if (Directory.Exists(path)) flags |= Native.FILE_FLAG_BACKUP_SEMANTICS;

        var handle = Native.CreateFileW(
            path,
            dwDesiredAccess,
            Native.FILE_SHARE_READ | Native.FILE_SHARE_WRITE | Native.FILE_SHARE_DELETE,
            IntPtr.Zero,
            Native.OPEN_EXISTING,
            flags,
            IntPtr.Zero);

        if (handle.IsInvalid)
            throw new Win32Exception(Marshal.GetLastWin32Error(), $"Failed to open file handle: {path}");

        return handle;
    }

    private static class Native
    {
        public const uint FILE_WRITE_ATTRIBUTES = 0x100;
        public const uint FILE_SHARE_READ = 0x1;
        public const uint FILE_SHARE_WRITE = 0x2;
        public const uint FILE_SHARE_DELETE = 0x4;
        public const uint OPEN_EXISTING = 0x3;
        public const uint FILE_FLAG_OPEN_REPARSE_POINT = 0x00200000;
        public const uint FILE_FLAG_BACKUP_SEMANTICS = 0x02000000;
        public const uint CF_HYDRATE_FLAG_NONE = 0;
        public const uint CF_DEHYDRATE_FLAG_NONE = 0;

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode, SetLastError = true)]
        public static extern SafeFileHandle CreateFileW(
            string lpFileName,
            uint dwDesiredAccess,
            uint dwShareMode,
            IntPtr lpSecurityAttributes,
            uint dwCreationDisposition,
            uint dwFlagsAndAttributes,
            IntPtr hTemplateFile);

        [DllImport("kernel32.dll", SetLastError = true)]
        [return: MarshalAs(UnmanagedType.Bool)]
        public static extern bool GetFileSizeEx(SafeFileHandle hFile, out long lpFileSize);

        [DllImport("cldapi.dll")]
        public static extern int CfHydratePlaceholder(
            SafeFileHandle fileHandle,
            long startingOffset,
            long length,
            uint hydrateFlags,
            IntPtr overlapped);

        [DllImport("cldapi.dll")]
        public static extern int CfDehydratePlaceholder(
            SafeFileHandle fileHandle,
            long startingOffset,
            long length,
            uint dehydrateFlags,
            IntPtr overlapped);
    }
}
