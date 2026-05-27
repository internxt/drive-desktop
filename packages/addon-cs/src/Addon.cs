using System.Collections.Concurrent;
using Microsoft.JavaScript.NodeApi;

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

    public static Task HydrateFile(string path) => Placeholder.HydrateAsync(path);

    public static Task DehydrateFile(string path) => Placeholder.DehydrateAsync(path);

    public static Task<long> ConnectSyncRoot(string syncRootPath, JSValue onFetchData)
        => SyncRootConnection.ConnectAsync(syncRootPath, onFetchData);

    public static Task DisconnectSyncRoot(long connectionKey)
        => SyncRootConnection.DisconnectAsync(connectionKey);
}
