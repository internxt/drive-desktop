using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.CloudFilters;

namespace Intx.Addon;

internal sealed class FetchData : IDisposable
{
    public required SyncRootConnection Owner { get; init; }
    public required CF_CONNECTION_KEY ConnectionKey { get; init; }
    public required long TransferKey { get; init; }
    public required long FileSize { get; init; }
    public required long RequiredLength { get; init; }
    public required long RequiredOffset { get; init; }
    public required string Path { get; init; }
    public ManualResetEventSlim Done { get; } = new(false);

    public void Dispose() => Done.Dispose();

    public void InvokeJsCallback()
    {
        var responder = JSValue.CreateFunction("respondFetchData", Respond);
        Owner.Callback.Call(
            JSValue.Undefined,
            ConnectionKey.Value,
            Path,
            responder);
    }

    private JSValue Respond(JSCallbackArgs args)
    {
        try
        {
            var bufferArg = args[0];
            long offset = (long)args[1];

            var bufferData = bufferArg.GetTypedArrayData<byte>();
            int length = bufferData.Length;

            unsafe
            {
                fixed (byte* p = bufferData)
                {
                    var hr = ExecuteTransferData(p, offset, length, NTSTATUS.STATUS_SUCCESS);
                    if (hr.Value < 0)
                    {
                        ExecuteTransferData(null, RequiredOffset, RequiredLength, NTSTATUS.STATUS_UNSUCCESSFUL);
                        throw Marshal.GetExceptionForHR(hr.Value) ?? new Exception($"CfExecute(TransferData) failed: 0x{hr.Value:X8}");
                    }
                }
            }

            long completed = offset + length;
            PInvoke.CfReportProviderProgress(ConnectionKey, TransferKey, FileSize, completed);

            if (completed >= FileSize)
            {
                // v2.6.9 Daniel Jiménez
                // This is to put the icon as full green. Currently we were doing that but technically we shouldn't since
                // it's not the same as clicking on `Always keep on this device`.
                // using var handle = FileHandleHelper.OpenFileHandle(Path, FILE_ACCESS_RIGHTS.FILE_WRITE_ATTRIBUTES, true);
                // PInvoke.CfSetPinState(handle, CF_PIN_STATE.CF_PIN_STATE_PINNED, CF_SET_PIN_FLAGS.CF_SET_PIN_FLAG_NONE);
                Done.Set();
            }
        }
        catch
        {
            Done.Set();
            throw;
        }

        return JSValue.Undefined;
    }

    private unsafe HRESULT ExecuteTransferData(void* data, long offset, long length, NTSTATUS status)
    {
        CF_OPERATION_INFO opInfo = default;
        opInfo.StructSize = (uint)sizeof(CF_OPERATION_INFO);
        opInfo.Type = CF_OPERATION_TYPE.CF_OPERATION_TYPE_TRANSFER_DATA;
        opInfo.ConnectionKey = ConnectionKey;
        opInfo.TransferKey = TransferKey;

        CF_OPERATION_PARAMETERS opParams = default;
        opParams.ParamSize = (uint)sizeof(CF_OPERATION_PARAMETERS);
        opParams.Anonymous.TransferData.CompletionStatus = status;
        opParams.Anonymous.TransferData.Buffer = data;
        opParams.Anonymous.TransferData.Offset = offset;
        opParams.Anonymous.TransferData.Length = length;

        return PInvoke.CfExecute(in opInfo, ref opParams);
    }
}
