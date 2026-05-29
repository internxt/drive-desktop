using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.CloudFilters;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

internal static class Placeholder
{
    public static Task HydrateAsync(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot hydrate folder");

        using var handle = FileHandleHelper.OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, true);

        HRESULT hr = PInvoke.CfHydratePlaceholder(handle, 0, -1, CF_HYDRATE_FLAGS.CF_HYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfHydratePlaceholder failed: 0x{hr.Value:X8}");
    });

    public static Task DehydrateAsync(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot dehydrate folder");

        using var handle = FileHandleHelper.OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, true);

        HRESULT hr = PInvoke.CfDehydratePlaceholder(handle, 0, -1, CF_DEHYDRATE_FLAGS.CF_DEHYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfDehydratePlaceholder failed: 0x{hr.Value:X8}");
    });
}
