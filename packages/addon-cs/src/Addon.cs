using System.Collections.Concurrent;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.CloudFilters;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

[JSExport]
public static class Addon
{
    private static readonly ConcurrentDictionary<string, FileWatcher> _watchers = new();

    public static JSValue WatchPath(string rootPath, JSValue onEvent)
    {
        var id = Guid.NewGuid().ToString("N");
        var watcher = new FileWatcher(rootPath, onEvent);
        _watchers[id] = watcher;
        watcher.Start();

        var handle = JSValue.CreateObject();
        handle["id"] = id;
        return handle;
    }

    public static void UnwatchPath(JSValue handle)
    {
        var id = (string)handle["id"];
        if (_watchers.TryRemove(id, out var w))
        {
            w.Stop();
        }
    }

    public static Task HydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot hydrate folder");

        using var handle = FileHandleHelper.OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, true);

        HRESULT hr = PInvoke.CfHydratePlaceholder(handle, 0, -1, CF_HYDRATE_FLAGS.CF_HYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfHydratePlaceholder failed: 0x{hr.Value:X8}");
    });

    public static Task DehydrateFile(string path) => Task.Run(() =>
    {
        if (Directory.Exists(path))
            throw new InvalidOperationException("Cannot dehydrate folder");

        using var handle = FileHandleHelper.OpenFileHandle(path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, true);

        HRESULT hr = PInvoke.CfDehydratePlaceholder(handle, 0, -1, CF_DEHYDRATE_FLAGS.CF_DEHYDRATE_FLAG_NONE, ref Unsafe.NullRef<NativeOverlapped>());
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfDehydratePlaceholder failed: 0x{hr.Value:X8}");
    });

    public static Task<long> ConnectSyncRoot(string syncRootPath, JSValue onFetchData)
        => SyncRootConnection.ConnectAsync(syncRootPath, onFetchData);

    public static Task DisconnectSyncRoot(long connectionKey)
        => SyncRootConnection.DisconnectAsync(connectionKey);
}
