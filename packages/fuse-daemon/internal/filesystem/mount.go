package filesystem

import (
	"log/slog"
	"os/exec"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"

	"github.com/hanwen/go-fuse/v2/fuse"
	"github.com/hanwen/go-fuse/v2/fuse/nodefs"
	"github.com/hanwen/go-fuse/v2/fuse/pathfs"
)

// Mount attaches InternxtFilesystem to mountPoint and starts serving FUSE operations.
// Returns the server (for unmounting on shutdown) and a done channel that closes
// when the server stops — either via Unmount or external fusermount -u.
func Mount(mountPoint string, logger *slog.Logger, client *client.Client) (*fuse.Server, <-chan struct{}, error) {
	fileSystem := NewInternxtFilesystem(logger, client)

	nodeFileSystem := pathfs.NewPathNodeFs(fileSystem, nil)

	mountOptions := &fuse.MountOptions{
		AllowOther:    false,
		MaxReadAhead:  128 * 1024,
		DisableXAttrs: false,
		Debug:         false,
    DirectMount: true,
	}

	// Clear any stale FUSE mount left from a previous crash or unclean shutdown.
	// fusermount3 -uz works as a regular user; errors are ignored since the mount may not exist.
	_ = exec.Command("fusermount3", "-uz", mountPoint).Run()

	server, _, err := nodefs.Mount(mountPoint, nodeFileSystem.Root(), mountOptions, nil)
	if err != nil {
		return nil, nil, err
	}

	done := make(chan struct{})
	go func() {
		server.Serve()
		close(done)
	}()

	return server, done, nil
}
