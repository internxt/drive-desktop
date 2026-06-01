package filesystem

import (
	"context"
	"encoding/base64"
	"strconv"
	"log/slog"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"

	"github.com/hanwen/go-fuse/v2/fuse"
	"github.com/hanwen/go-fuse/v2/fuse/nodefs"
)

type WriteCallbackData struct {
	Written uint32 `json:"written"`
}

// InternxtFile is the file handle returned by Open.
// It holds the context needed for future Read/Write implementation.
// Operations with a path-based fallback (GetAttr, Chmod, Chown, Truncate, Utimens)
// are intentionally not overridden — DefaultFile returns ENOSYS which triggers
// the fallback to InternxtFilesystem automatically.
type InternxtFile struct {
	nodefs.File
	path        string
	flag        uint32
	processName string
	logger      *slog.Logger
	client      *client.Client
}

func NewInternxtFile(path string, flag uint32, processName string, logger *slog.Logger, c *client.Client) *InternxtFile {
	return &InternxtFile{
		File:        nodefs.NewDefaultFile(),
		path:        path,
		flag:        flag,
		processName: processName,
		logger:      logger,
		client:      c,
	}
}

func (f *InternxtFile) String() string {
	return "InternxtFile(" + f.path + ")"
}

func (f *InternxtFile) Read(dest []byte, off int64) (fuse.ReadResult, fuse.Status) {
	f.logger.Debug("Received Read call", "path", f.path, "offset", off, "length", len(dest))
	body := struct {
		Path        string `json:"path"`
		Offset      int64  `json:"offset"`
		Length      int    `json:"length"`
		ProcessName string `json:"processName"`
	}{Path: f.path, Offset: off, Length: len(dest), ProcessName: f.processName}

	bytesRead, status := f.client.PostBinary(context.Background(), client.OperationRead, body, dest)
	if status != fuse.OK {
		f.logger.Error("Error occurred while reading file", "status", status)
		return nil, status
	}
	return fuse.ReadResultData(dest[:bytesRead]), fuse.OK
}

func (f *InternxtFile) Write(data []byte, off int64) (uint32, fuse.Status) {
	f.logger.Debug("Received Write call", "path", f.path, "offset", off, "length", len(data))
	headers := map[string]string{
		"X-Path-B64": base64.StdEncoding.EncodeToString([]byte(f.path)),
		"X-Offset": strconv.FormatInt(off, 10),
	}

	if status := f.client.PostSendBinary(context.Background(), client.OperationWrite, data, headers); status != fuse.OK {
		f.logger.Error("Error occurred while writing file", "status", status)
		return 0, status
	}

	return uint32(len(data)), fuse.OK
}

// v.2.6.0
// Esteban Galvis Triana
// Flush is called on each close(2) of the file descriptor.
// Multiple flushes may occur if the file descriptor was duplicated.
// Data is already persisted to the temporal file via Write, so no action is needed here.
func (f *InternxtFile) Flush() fuse.Status {
	return fuse.OK
}

func (f *InternxtFile) Release() {
	f.logger.Debug("Received Release call:", "path", f.path)
	body := struct {
		Path        string `json:"path"`
		ProcessName string `json:"processName"`
	}{Path: f.path, ProcessName: f.processName}
	if status := f.client.Post(context.Background(), client.OperationRelease, body, nil); status != fuse.OK {
		f.logger.Warn("Release call failed", "path", f.path, "status", status)
	}
}

// v.2.6.0
// Esteban Galvis Triana
// Fsync is called when the application requests a data flush (fsync/fdatasync).
// Data is already persisted to the temporal file on each Write call, so there is
// nothing extra to flush. Returning OK satisfies the caller without triggering ENOSYS.
func (f *InternxtFile) Fsync(flags int) fuse.Status {
	f.logger.Debug("Received Fsync call", "path", f.path)
	return fuse.OK
}
