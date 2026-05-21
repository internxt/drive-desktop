using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.JavaScript.NodeApi.Interop;
using Microsoft.Win32.SafeHandles;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

internal sealed class FileWatcher(string rootPath, JSValue onEvent)
{
    private const int BufferSize = 64 * 1024;
    // number of 100-ns intervals between 1601 and 1970
    private const long EpochOffsetTicks = 116444736000000000L;

    private readonly JSReference _callbackRef = new(onEvent);
    private readonly JSSynchronizationContext _syncCtx = JSSynchronizationContext.Current
            ?? throw new InvalidOperationException("No JSSynchronizationContext on current thread");
    private readonly CancellationTokenSource _cts = new();

    public void Start()
    {
        new Thread(Run) { IsBackground = true, Name = "FileWatcher" }.Start();
    }

    public void Stop()
    {
        _cts.Cancel();
    }

    private void Run()
    {
        try
        {
            using var handle = FileHandleHelper.OpenFileHandle(rootPath, FILE_ACCESS_RIGHTS.FILE_LIST_DIRECTORY, false);
            WatchLoop(handle);
        }
        catch (Exception ex)
        {
            SendError(ex.Message);
        }
        finally
        {
            _syncCtx.Post(_ => _callbackRef.Dispose(), null);
        }
    }

    private const FILE_NOTIFY_CHANGE NotifyFilter =
        FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_FILE_NAME |
        FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_DIR_NAME |
        FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_SIZE |
        FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_ATTRIBUTES;

    private unsafe void WatchLoop(SafeFileHandle hDirectory)
    {
        byte[] buffer = new byte[BufferSize];

        while (!_cts.IsCancellationRequested)
        {
            uint bytesReturned;

            fixed (byte* pBuffer = buffer)
            {
                BOOL success = PInvoke.ReadDirectoryChangesEx(
                    (HANDLE)hDirectory.DangerousGetHandle(),
                    pBuffer,
                    BufferSize,
                    bWatchSubtree: true,
                    NotifyFilter,
                    &bytesReturned,
                    lpOverlapped: null,
                    lpCompletionRoutine: null,
                    READ_DIRECTORY_NOTIFY_INFORMATION_CLASS.ReadDirectoryNotifyExtendedInformation);

                if (!success)
                {
                    SendError($"ReadDirectoryChangesEx failed: {Marshal.GetLastWin32Error()}");
                    break;
                }

                if (_cts.IsCancellationRequested) break;

                var fni = (FILE_NOTIFY_EXTENDED_INFORMATION*)pBuffer;
                while (true)
                {
                    ProcessEvent(fni);
                    if (fni->NextEntryOffset == 0) break;
                    fni = (FILE_NOTIFY_EXTENDED_INFORMATION*)((byte*)fni + fni->NextEntryOffset);
                }
            }
        }
    }

    private unsafe void ProcessEvent(FILE_NOTIFY_EXTENDED_INFORMATION* fni)
    {
        int nameLen = (int)fni->FileNameLength / sizeof(char);
        char* pName = (char*)Unsafe.AsPointer(ref Unsafe.AsRef(in fni->FileName));
        string filename = new(pName, 0, nameLen);

        string path = (rootPath + "/" + filename).Replace('\\', '/');
        string type = (fni->FileAttributes & (uint)FILE_FLAGS_AND_ATTRIBUTES.FILE_ATTRIBUTE_DIRECTORY) != 0 ? "folder" : "file";
        long internalId = fni->FileId;
        long size = fni->FileSize;
        double ctimeMs = FileTimeToUnixMs(fni->LastChangeTime);
        double mtimeMs = FileTimeToUnixMs(fni->LastModificationTime);

        string? action = fni->Action switch
        {
            FILE_ACTION.FILE_ACTION_ADDED => "create",
            FILE_ACTION.FILE_ACTION_REMOVED => "delete",
            FILE_ACTION.FILE_ACTION_MODIFIED => "update",
            FILE_ACTION.FILE_ACTION_RENAMED_NEW_NAME => "rename_new",
            _ => null,
        };

        if (action == null) return;

        SendSuccess(action, type, path, internalId, size, ctimeMs, mtimeMs);
    }

    private static double FileTimeToUnixMs(long fileTime)
        => (fileTime - EpochOffsetTicks) / 10000.0;

    private void SendSuccess(string action, string type, string path, long internalId, long size, double ctimeMs, double mtimeMs)
    {
        _syncCtx.Post(_ =>
        {
            var evt = JSValue.CreateObject();
            evt["action"] = action;
            evt["type"] = type;
            evt["path"] = path;
            evt["internalId"] = internalId;
            evt["size"] = size;
            evt["ctimeMs"] = ctimeMs;
            evt["mtimeMs"] = mtimeMs;

            _callbackRef.GetValue().Call(JSValue.Undefined, evt);
        }, null);
    }

    private void SendError(string message)
    {
        _syncCtx.Post(_ =>
        {
            var evt = JSValue.CreateObject();
            evt["action"] = "error";
            evt["path"] = message;

            _callbackRef.GetValue().Call(JSValue.Undefined, evt);
        }, null);
    }
}
