package config

import (
	"fmt"
	"os"
)

type Config struct {
	MountPoint string
	SocketPath string
	LogFile    string
	BootID     string
}
func ParseConfig() Config {
	config := Config{
		MountPoint: os.Getenv("INTERNXT_MOUNT"),
		SocketPath: os.Getenv("INTERNXT_SOCKET"),
		LogFile:    os.Getenv("INTERNXT_LOG_FILE"),
		BootID:     os.Getenv("INTERNXT_BOOT_ID"),
	}

	var missing []string
	if config.MountPoint == "" {
		missing = append(missing, "INTERNXT_MOUNT")
	}
	if config.SocketPath == "" {
		missing = append(missing, "INTERNXT_SOCKET")
	}
	if config.LogFile == "" {
		missing = append(missing, "INTERNXT_LOG_FILE")
	}
	if config.BootID == "" {
		missing = append(missing, "INTERNXT_BOOT_ID")
	}

	if len(missing) > 0 {
		for _, envVar := range missing {
			fmt.Fprintf(os.Stderr, "missing required environment variable: %s\n", envVar)
		}
		os.Exit(1)
	}

	return config
}
