using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.JavaScript.NodeApi.Interop;
using Windows.Win32;
using Windows.Win32.Storage.CloudFilters;

namespace Intx.Addon;

internal static class SyncRootConnection
{
    public static JSReference? CallbackRef;
    public static JSSynchronizationContext SyncCtx = JSSynchronizationContext.Current
            ?? throw new InvalidOperationException("No JSSynchronizationContext on current thread");

    public static Task<long> ConnectAsync(string rootPath, JSValue onFetchData)
    {
        CallbackRef = new JSReference(onFetchData);
        return Task.Run(() => Connect(rootPath));
    }

    public static Task DisconnectAsync(long connectionKey) => Task.Run(() =>
    {
        var hr = PInvoke.CfDisconnectSyncRoot((CF_CONNECTION_KEY)connectionKey);
        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfDisconnectSyncRoot failed: 0x{hr.Value:X8}");
    });

    private static unsafe long Connect(string rootPath)
    {
        var callbacks = new CF_CALLBACK_REGISTRATION[]
        {
            new() { Type = CF_CALLBACK_TYPE.CF_CALLBACK_TYPE_FETCH_DATA, Callback = FetchDataNative },
            new() { Type = CF_CALLBACK_TYPE.CF_CALLBACK_TYPE_NONE, Callback = null! },
        };

        var hr = PInvoke.CfConnectSyncRoot(
            rootPath,
            callbacks,
            null,
            CF_CONNECT_FLAGS.CF_CONNECT_FLAG_REQUIRE_PROCESS_INFO | CF_CONNECT_FLAGS.CF_CONNECT_FLAG_REQUIRE_FULL_FILE_PATH,
            out var key);

        if (hr.Value < 0)
            throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfConnectSyncRoot failed: 0x{hr.Value:X8}");

        return key.Value;
    }

    private static unsafe void FetchDataNative(CF_CALLBACK_INFO* info, CF_CALLBACK_PARAMETERS* parameters)
    {
        try
        {
            var path = info->VolumeDosName.ToString() + info->NormalizedPath.ToString();

            using var ctx = new FetchData
            {
                ConnectionKey = info->ConnectionKey,
                TransferKey = info->TransferKey,
                FileSize = info->FileSize,
                RequiredLength = parameters->Anonymous.FetchData.RequiredLength,
                RequiredOffset = parameters->Anonymous.FetchData.RequiredFileOffset,
                Path = path,
            };

            SyncCtx.Post(_ => ctx.InvokeJsCallback(), null);
            ctx.Done.Wait();
        }
        catch
        {
            // CF callback must not throw across native boundary
        }
    }
}
