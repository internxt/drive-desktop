using System.ComponentModel;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using Microsoft.JavaScript.NodeApi;
using Microsoft.JavaScript.NodeApi.Interop;
using Microsoft.Win32.SafeHandles;
using Windows.Win32;
using Windows.Win32.Foundation;
using Windows.Win32.Storage.FileSystem;

namespace Intx.Addon;

internal sealed class FileWatcher
{
    private const int BufferSize = 64 * 1024;
    private const long EpochOffsetTicks = 116444736000000000L;

    private readonly string _rootPath;
    private readonly JSReference _callbackRef;
    private readonly JSSynchronizationContext _syncCtx;
    private readonly CancellationTokenSource _cts = new();
    private Thread? _thread;

    public FileWatcher(string rootPath, JSValue onEvent)
    {
        _rootPath = rootPath;
        _callbackRef = new JSReference(onEvent);
        _syncCtx = JSSynchronizationContext.Current
            ?? throw new InvalidOperationException("No JSSynchronizationContext on current thread");
    }

    public void Start()
    {
        _thread = new Thread(Run) { IsBackground = true, Name = "FileWatcher" };
        _thread.Start();
    }

    public void Stop()
    {
        _cts.Cancel();
    }

    private void Run()
    {
        try
        {
            using var handle = OpenDirectoryHandle(_rootPath);
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

    private static SafeFileHandle OpenDirectoryHandle(string path)
    {
        var handle = PInvoke.CreateFile(
            path,
            (uint)FILE_ACCESS_RIGHTS.FILE_LIST_DIRECTORY,
            FILE_SHARE_MODE.FILE_SHARE_READ | FILE_SHARE_MODE.FILE_SHARE_WRITE | FILE_SHARE_MODE.FILE_SHARE_DELETE,
            null,
            FILE_CREATION_DISPOSITION.OPEN_EXISTING,
            FILE_FLAGS_AND_ATTRIBUTES.FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAGS_AND_ATTRIBUTES.FILE_FLAG_OVERLAPPED,
            null);

        if (handle.IsInvalid)
            throw new Win32Exception(Marshal.GetLastWin32Error(), $"Failed to open directory: {path}");

        return handle;
    }

    private unsafe void WatchLoop(SafeFileHandle hDirectory)
    {
        byte[] buffer = new byte[BufferSize];
        const FILE_NOTIFY_CHANGE filter =
            FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_FILE_NAME |
            FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_DIR_NAME |
            FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_SIZE |
            FILE_NOTIFY_CHANGE.FILE_NOTIFY_CHANGE_ATTRIBUTES;

        while (!_cts.IsCancellationRequested)
        {
            uint bytesReturned;
            BOOL success;

            fixed (byte* pBuffer = buffer)
            {
                success = PInvoke.ReadDirectoryChangesEx(
                    (HANDLE)hDirectory.DangerousGetHandle(),
                    pBuffer,
                    BufferSize,
                    bWatchSubtree: true,
                    filter,
                    &bytesReturned,
                    lpOverlapped: null,
                    lpCompletionRoutine: null,
                    READ_DIRECTORY_NOTIFY_INFORMATION_CLASS.ReadDirectoryNotifyExtendedInformation);
            }

            if (!success)
            {
                SendError($"ReadDirectoryChangesExW failed: {Marshal.GetLastWin32Error()}");
                break;
            }

            if (_cts.IsCancellationRequested) break;

            fixed (byte* pBuffer = buffer)
            {
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
        string filename = new string(pName, 0, nameLen);

        string path = (_rootPath + "/" + filename).Replace('\\', '/');
        string type = ((uint)fni->FileAttributes & 0x10) != 0 ? "folder" : "file";
        long internalId = fni->FileId;
        long size = fni->FileSize;
        double ctimeMs = FileTimeToUnixMs(fni->LastChangeTime);
        double mtimeMs = FileTimeToUnixMs(fni->LastModificationTime);

        string? action = (uint)fni->Action switch
        {
            1 => "create",
            2 => "delete",
            3 => "update",
            4 => "rename_old",
            5 => "rename_new",
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
            var cb = _callbackRef.GetValue();

            var evt = JSValue.CreateObject();
            evt["action"] = action;
            evt["type"] = type;
            evt["path"] = path;
            evt["internalId"] = internalId;
            evt["size"] = size;
            evt["ctimeMs"] = ctimeMs;
            evt["mtimeMs"] = mtimeMs;

            cb.Call(JSValue.Undefined, evt);
        }, null);
    }

    private void SendError(string message)
    {
        _syncCtx.Post(_ =>
        {
            var cb = _callbackRef.GetValue();

            var evt = JSValue.CreateObject();
            evt["action"] = "error";
            evt["type"] = "error";
            evt["path"] = message;

            cb.Call(JSValue.Undefined, evt);
        }, null);
    }
}
