package filesystem

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"
)

type releaseRequest struct {
	Path        string `json:"path"`
	ProcessName string `json:"processName"`
}

func respondBinary(w http.ResponseWriter, data []byte) {
	w.Header().Set("X-Errno", "0")
	w.Header().Set("Content-Type", "application/octet-stream")
	_, _ = w.Write(data)
}

func nonEmptyFileAttrHandler(size uint64) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, map[string]any{
			"errno": 0,
			"mode":  0o100644,
			"size":  size,
			"mtime": time.Now(),
			"ctime": time.Now(),
			"uid":   uint32(os.Getuid()),
			"gid":   uint32(os.Getgid()),
			"nlink": 1,
		})
	}
}

func TestRelease(t *testing.T) {
	t.Run("sends path and processName to electron on close", func(t *testing.T) {
		var received releaseRequest

		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRelease: func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				_ = json.Unmarshal(body, &received)
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		f, err := os.Open(filepath.Join(sharedMount.mountPoint, fileName))
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		_ = f.Close()

		// give the async Release call time to reach the mock server
		time.Sleep(50 * time.Millisecond)

		if received.Path != fileName {
			t.Errorf("path: got %q, want %q", received.Path, fileName)
		}
	})

	t.Run("does not block when electron returns an error", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRelease: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
			},
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		f, err := os.Open(filepath.Join(sharedMount.mountPoint, fileName))
		if err != nil {
			t.Fatalf("open: %v", err)
		}

		done := make(chan struct{})
		go func() {
			_ = f.Close()
			close(done)
		}()

		select {
		case <-done:
		case <-time.After(2 * time.Second):
			t.Fatal("Close() blocked — Release did not return")
		}
	})
}

func TestFsync(t *testing.T) {
	noopHandlers := map[client.OperationPath]http.HandlerFunc{
		client.OperationGetAttr: fileAttrHandler,
		client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
			respondJSON(w, client.ErrorResponse{Errno: 0})
		},
		client.OperationRelease: func(w http.ResponseWriter, r *http.Request) {
			respondJSON(w, client.ErrorResponse{Errno: 0})
		},
	}

	t.Run("returns OK without calling the backend", func(t *testing.T) {
		fsyncCalled := false
		handlers := make(map[client.OperationPath]http.HandlerFunc, len(noopHandlers))
		for k, v := range noopHandlers {
			handlers[k] = v
		}
		handlers["/op/fsync"] = func(w http.ResponseWriter, r *http.Request) {
			fsyncCalled = true
			respondJSON(w, client.ErrorResponse{Errno: 0})
		}
		sharedMount.mockServer.setHandlers(handlers)

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		f, err := os.OpenFile(filepath.Join(sharedMount.mountPoint, fileName), os.O_WRONLY, 0)
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		defer func() { _ = f.Close() }()

		if err := f.Sync(); err != nil {
			t.Fatalf("fsync: %v", err)
		}

		if fsyncCalled {
			t.Error("expected Fsync to be handled locally — backend should not be called")
		}
	})
}

func TestRead(t *testing.T) {
	noopRelease := func(w http.ResponseWriter, r *http.Request) {
		respondJSON(w, client.ErrorResponse{Errno: 0})
	}

	t.Run("returns file contents", func(t *testing.T) {
		content := []byte("hello from internxt")

		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: nonEmptyFileAttrHandler(uint64(len(content))),
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRead: func(w http.ResponseWriter, r *http.Request) {
				respondBinary(w, content)
			},
			client.OperationRelease: noopRelease,
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		data, err := os.ReadFile(filepath.Join(sharedMount.mountPoint, fileName))
		if err != nil {
			t.Fatalf("read: %v", err)
		}

		if string(data) != string(content) {
			t.Errorf("content: got %q, want %q", string(data), string(content))
		}
	})

	t.Run("sends path, offset, length and processName to electron", func(t *testing.T) {
		type readRequest struct {
			Path        string `json:"path"`
			Offset      int64  `json:"offset"`
			Length      int    `json:"length"`
			ProcessName string `json:"processName"`
		}
		var received readRequest

		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: nonEmptyFileAttrHandler(1024),
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRead: func(w http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				_ = json.Unmarshal(body, &received)
				respondBinary(w, []byte{})
			},
			client.OperationRelease: noopRelease,
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		_, _ = os.ReadFile(filepath.Join(sharedMount.mountPoint, fileName))

		if received.Path != fileName {
			t.Errorf("path: got %q, want %q", received.Path, fileName)
		}
		if received.Offset != 0 {
			t.Errorf("offset: got %d, want 0", received.Offset)
		}
		if received.Length <= 0 {
			t.Errorf("length: got %d, want > 0", received.Length)
		}
	})

	t.Run("returns EIO on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: nonEmptyFileAttrHandler(1024),
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRead: func(w http.ResponseWriter, r *http.Request) {
				w.WriteHeader(http.StatusInternalServerError)
			},
			client.OperationRelease: noopRelease,
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		_, err := os.ReadFile(filepath.Join(sharedMount.mountPoint, fileName))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		pathErr, ok := err.(*os.PathError)
		if !ok {
			t.Fatalf("expected *os.PathError, got %T", err)
		}

		if pathErr.Err != syscall.EIO {
			t.Errorf("expected EIO, got %v", pathErr.Err)
		}
	})

	t.Run("returns ENOENT when errno is 2", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: nonEmptyFileAttrHandler(1024),
			client.OperationOpen: func(w http.ResponseWriter, r *http.Request) {
				respondJSON(w, client.ErrorResponse{Errno: 0})
			},
			client.OperationRead: func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("X-Errno", "2")
				w.WriteHeader(http.StatusOK)
			},
			client.OperationRelease: noopRelease,
		})

		fileName := fmt.Sprintf("file-%d.txt", time.Now().UnixNano())
		_, err := os.ReadFile(filepath.Join(sharedMount.mountPoint, fileName))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		pathErr, ok := err.(*os.PathError)
		if !ok {
			t.Fatalf("expected *os.PathError, got %T", err)
		}

		if pathErr.Err != syscall.ENOENT {
			t.Errorf("expected ENOENT, got %v", pathErr.Err)
		}
	})
}
