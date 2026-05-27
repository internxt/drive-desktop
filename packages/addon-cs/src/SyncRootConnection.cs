using System.Collections.Concurrent;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.JavaScript.NodeApi.Interop;
using Windows.Win32;
using Windows.Win32.Storage.CloudFilters;

namespace Intx.Addon;

internal sealed class SyncRootConnection
{
    private static readonly ConcurrentDictionary<long, SyncRootConnection> _connections = new();

    private readonly JSReference _onFetchData;
    public JSSynchronizationContext SyncCtx { get; }
    public long ConnectionKey { get; private set; }

    private SyncRootConnection(JSValue onFetchData)
    {
        _onFetchData = new JSReference(onFetchData);
        SyncCtx = JSSynchronizationContext.Current
            ?? throw new InvalidOperationException("No JSSynchronizationContext on current thread");
    }

    public JSValue Callback => _onFetchData.GetValue();

    public static Task<long> ConnectAsync(string syncRootPath, JSValue onFetchData)
    {
        var conn = new SyncRootConnection(onFetchData);
        return Task.Run(() => conn.Connect(syncRootPath));
    }

    public static Task DisconnectAsync(long connectionKey) => Task.Run(() =>
    {
        var hr = PInvoke.CfDisconnectSyncRoot((CF_CONNECTION_KEY)connectionKey);
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfDisconnectSyncRoot failed: 0x{hr.Value:X8}");
    });

    private unsafe long Connect(string syncRootPath)
    {
        var callbacks = new CF_CALLBACK_REGISTRATION[]
        {
            new() { Type = CF_CALLBACK_TYPE.CF_CALLBACK_TYPE_FETCH_DATA, Callback = FetchDataNative },
            new() { Type = CF_CALLBACK_TYPE.CF_CALLBACK_TYPE_NONE, Callback = null! },
        };

        var hr = PInvoke.CfConnectSyncRoot(
            syncRootPath,
            callbacks,
            null,
            CF_CONNECT_FLAGS.CF_CONNECT_FLAG_REQUIRE_PROCESS_INFO | CF_CONNECT_FLAGS.CF_CONNECT_FLAG_REQUIRE_FULL_FILE_PATH,
            out var key);

        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfConnectSyncRoot failed: 0x{hr.Value:X8}");

        ConnectionKey = key.Value;
        _connections[ConnectionKey] = this;
        return ConnectionKey;
    }

    private static unsafe void FetchDataNative(CF_CALLBACK_INFO* info, CF_CALLBACK_PARAMETERS* parameters)
    {
        try
        {
            if (!_connections.TryGetValue(info->ConnectionKey.Value, out var conn)) return;

            var path = info->VolumeDosName.ToString() + info->NormalizedPath.ToString();

            using var ctx = new FetchData
            {
                Owner = conn,
                ConnectionKey = info->ConnectionKey,
                TransferKey = info->TransferKey,
                FileSize = info->FileSize,
                RequiredLength = parameters->Anonymous.FetchData.RequiredLength,
                RequiredOffset = parameters->Anonymous.FetchData.RequiredFileOffset,
                Path = path,
            };

            conn.SyncCtx.Post(_ => ctx.InvokeJsCallback(), null);
            ctx.Done.Wait();
        }
        catch
        {
            // CF callback must not throw across native boundary
        }
    }
}
