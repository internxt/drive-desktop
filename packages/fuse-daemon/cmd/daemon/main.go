package main

import (
	"os"
	"os/signal"
	"syscall"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"
	"internxt/drive-desktop-linux/fuse-daemon/internal/config"
	"internxt/drive-desktop-linux/fuse-daemon/internal/filesystem"
	"internxt/drive-desktop-linux/fuse-daemon/internal/logger"
)

func main() {
	config := config.ParseConfig()

	logger := logger.New(config.LogFile)

	logger.Info("starting fuse daemon", "mount", config.MountPoint, "socket", config.SocketPath)

	client := client.NewClient(config.SocketPath)

	server, done, err := filesystem.Mount(config.MountPoint, logger, client)
	if err != nil {
		logger.Error("failed to mount fuse filesystem", "error", err)
		os.Exit(1)
	}

	logger.Info("fuse filesystem mounted", "mount", config.MountPoint)

	if err := client.NotifyReady(logger); err != nil {
		logger.Error("failed to notify electron of readiness", "error", err)
		if err := server.Unmount(); err != nil {
      logger.Error("failed to unmount fuse filesystem", "error", err)
    }
		os.Exit(1)
	}

	stop := make(chan os.Signal, 1)
	signal.Notify(stop, syscall.SIGINT, syscall.SIGTERM)

	select {
	case <-stop:
		logger.Info("received shutdown signal")
	case <-done:
		logger.Warn("fuse filesystem was unmounted externally")
	}

	if err := server.Unmount(); err != nil {
		logger.Error("failed to unmount fuse filesystem", "error", err)
	}

	logger.Info("fuse daemon stopped")
}




