package logger

import (
	"log/slog"

	"gopkg.in/lumberjack.v2"
)

func New(logFilePath string) *slog.Logger {

	rotatingWriter := &lumberjack.Logger{
		Filename:   logFilePath,
		MaxSize:    500, // MB
		MaxBackups: 3,
		MaxAge:     30, // days
		Compress:   true,
	}

	return slog.New(slog.NewJSONHandler(rotatingWriter, &slog.HandlerOptions{
		Level: slog.LevelDebug,
	}))
}
