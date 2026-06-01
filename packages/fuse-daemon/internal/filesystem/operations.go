package filesystem

import (
	"context"
	"fmt"
	"log/slog"
	"os"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"

	"github.com/hanwen/go-fuse/v2/fuse"
	"github.com/hanwen/go-fuse/v2/fuse/nodefs"
	"github.com/hanwen/go-fuse/v2/fuse/pathfs"
)

// readProcessName returns the process name for a given PID by reading /proc/<pid>/comm.
func readProcessName(pid uint32) string {
	data, err := os.ReadFile(fmt.Sprintf("/proc/%d/comm", pid))
	if err != nil {
		return ""
	}
	return string(data[:len(data)-1]) // trim trailing newline
}

// InternxtFilesystem is the FUSE filesystem implementation.
// Each method corresponds to a FUSE operation forwarded to Electron over HTTP.
//
// To implement an operation:
//  1. Add the method below with its correct signature
//  2. Remove the log line and ENOSYS return
//  3. Call the corresponding endpoint via the HTTP client: fs.client.Post("/op/<name>", ...)
//  4. Map the HTTP response back to the correct fuse.Status
type InternxtFilesystem struct {
	pathfs.FileSystem
	logger *slog.Logger
	client *client.Client
}

func NewInternxtFilesystem(logger *slog.Logger, client *client.Client) *InternxtFilesystem {
	return &InternxtFilesystem{
		FileSystem: pathfs.NewDefaultFileSystem(),
		logger:     logger,
		client:     client,
	}
}

func (fs *InternxtFilesystem) GetAttr(name string, context *fuse.Context) (*fuse.Attr, fuse.Status) {
	fs.logger.Debug("Received GetAttr call: ", "name", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}
	response := GetAttributesCallbackData{}
	if status := fs.client.Post(context, client.OperationGetAttr, body, &response); status != fuse.OK {
		fs.logger.Error("Error occurred while fetching attributes", "status", status)
		return nil, status
	}
	var atime uint64
	if response.Atime != nil {
		atime = uint64(response.Atime.Unix())
	}
	attr := &fuse.Attr{
		Mode:  response.Mode,
		Size:  response.Size,
		Mtime: uint64(response.Mtime.Unix()),
		Ctime: uint64(response.Ctime.Unix()),
		Atime: atime,
		Owner: fuse.Owner{Uid: response.Uid, Gid: response.Gid},
		Nlink: response.Nlink,
	}
	return attr, fuse.OK
}

func (fs *InternxtFilesystem) OpenDir(name string, context *fuse.Context) ([]fuse.DirEntry, fuse.Status) {
	fs.logger.Debug("Received OpenDir call", "name", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}
	response := OpenDirCallbackData{}
	if status := fs.client.Post(context, client.OperationOpenDir, body, &response); status != fuse.OK {
		fs.logger.Error("Error occurred while opening directory", "status", status)
		return nil, status
	}
	entries := make([]fuse.DirEntry, 0, len(response.Entries))
	for _, entry := range response.Entries {
		entries = append(entries, fuse.DirEntry{Name: entry.Name, Mode: entry.Mode})
	}
	return entries, fuse.OK
}

func (fs *InternxtFilesystem) Open(name string, flags uint32, context *fuse.Context) (nodefs.File, fuse.Status) {
	fs.logger.Debug("Received Open call", "name", name, "flags", flags)
	processName := readProcessName(context.Pid)
	body := struct {
		Path        string `json:"path"`
		Flag        uint32 `json:"flag"`
		ProcessName string `json:"processName"`
	}{Path: name, Flag: flags, ProcessName: processName}
	if status := fs.client.Post(context, client.OperationOpen, body, nil); status != fuse.OK {
		fs.logger.Error("Error occurred while opening file", "status", status)
		return nil, status
	}
	return NewInternxtFile(name, flags, processName, fs.logger, fs.client), fuse.OK
}

// Create creates a new file and returns a file handle.
// When implementing: return a nodefs.File handle for the new file.
func (fs *InternxtFilesystem) Create(name string, flags uint32, mode uint32, context *fuse.Context) (nodefs.File, fuse.Status) {
	fs.logger.Debug("Received Create call", "name", name, "flags", flags, "mode", mode)
	body := struct {
		Path string `json:"path"`
		Flag uint32 `json:"flag"`
		Mode uint32 `json:"mode"`
	}{Path: name, Flag: flags, Mode: mode}

	if status := fs.client.Post(context, client.OperationCreate, body, nil); status != fuse.OK {
		fs.logger.Error("Error occurred while creating file", "status", status)
		return nil, status
	}

	processName := readProcessName(context.Pid)
	return NewInternxtFile(name, flags, processName, fs.logger, fs.client), fuse.OK
}

func (fs *InternxtFilesystem) Mkdir(name string, mode uint32, context *fuse.Context) fuse.Status {
	fs.logger.Debug("Received Mkdir call", "path", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}
	return fs.client.Post(context, client.OperationMkdir, body, nil)
}

func (fs *InternxtFilesystem) Rename(oldName string, newName string, context *fuse.Context) fuse.Status {
	fs.logger.Debug("Received Rename call", "oldPath", oldName, "newPath", newName)
	body := struct {
		OldPath string `json:"oldPath"`
		NewPath string `json:"newPath"`
	}{OldPath: oldName, NewPath: newName}

	status := fs.client.Post(context, client.OperationRename, body, nil)
	if status != fuse.OK {
		return status
	}

	return fuse.OK
}

func (fs *InternxtFilesystem) Unlink(name string, context *fuse.Context) fuse.Status {
	fs.logger.Debug("Received Unlink call", "path", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}

	status := fs.client.Post(context, client.OperationUnlink, body, nil)
	if status != fuse.OK {
		return status
	}

	return fuse.OK
}

func (fs *InternxtFilesystem) Rmdir(name string, context *fuse.Context) fuse.Status {
	fs.logger.Debug("Received Rmdir call", "path", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}

	status := fs.client.Post(context, client.OperationRmdir, body, nil)
	if status != fuse.OK {
		return status
	}

	return fuse.OK
}

func (fs *InternxtFilesystem) Truncate(name string, size uint64, context *fuse.Context) fuse.Status {
	fs.logger.Debug("Received Truncate call", "path", name, "size", size)
	body := struct {
		Path string `json:"path"`
		Size uint64 `json:"size"`
	}{Path: name, Size: size}

	return fs.client.Post(context, client.OperationTruncate, body, nil)
}

func (fs *InternxtFilesystem) GetXAttr(name string, attr string, context *fuse.Context) ([]byte, fuse.Status) {
	fs.logger.Warn("not implemented", "op", "GetXAttr", "path", name, "attr", attr)
	return nil, fuse.ENOSYS
}

// v.2.6.0
// Esteban Galvis Triana
// StatFs returns filesystem-level statistics (total/free/available blocks and inodes).
// These values are used by applications (vim, cp, df) to determine whether
// there is sufficient space before writing. The backend queries the local
// disk where temporal files are stored and returns the real available space.
func (fs *InternxtFilesystem) StatFs(name string) *fuse.StatfsOut {
	fs.logger.Debug("Received StatFs call", "name", name)
	body := struct {
		Path string `json:"path"`
	}{Path: name}
	response := StatFsCallbackData{}
	if status := fs.client.Post(context.Background(), client.OperationStatFs, body, &response); status != fuse.OK {
		fs.logger.Error("Error occurred while getting filesystem stats", "status", status)
		return nil
	}
	return &fuse.StatfsOut{
		Blocks:  response.Blocks,
		Bfree:   response.Bfree,
		Bavail:  response.Bavail,
		Files:   response.Files,
		Ffree:   response.Ffree,
		Bsize:   response.Bsize,
		NameLen: response.NameLen,
	}
}
