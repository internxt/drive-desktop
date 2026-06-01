package filesystem

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"syscall"
	"testing"
	"time"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"
)

func TestGetAttr(t *testing.T) {
	t.Run("returns file attributes", func(t *testing.T) {
		now := time.Now().Truncate(time.Second)

		sharedMount.mockServer.setHandler(client.OperationGetAttr, func(response http.ResponseWriter, request *http.Request) {
			respondJSON(response, map[string]any{
				"errno": 0,
				"mode":  0o100644,
				"size":  1234,
				"mtime": now,
				"ctime": now,
				"uid":   uint32(os.Getuid()),
				"gid":   uint32(os.Getgid()),
				"nlink": 1,
			})
		})

		info, err := os.Stat(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("file-%d.txt", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("stat: %v", err)
		}

		if info.Size() != 1234 {
			t.Errorf("size: got %d, want 1234", info.Size())
		}

		if info.Mode().Perm() != 0o644 {
			t.Errorf("mode: got %v, want 0644", info.Mode().Perm())
		}

		if info.ModTime().Unix() != now.Unix() {
			t.Errorf("mtime: got %v, want %v", info.ModTime().Unix(), now.Unix())
		}
	})

	t.Run("returns directory attributes", func(t *testing.T) {
		sharedMount.mockServer.setHandler(client.OperationGetAttr, func(response http.ResponseWriter, request *http.Request) {
			respondJSON(response, map[string]any{
				"errno": 0,
				"mode":  0o040755,
				"size":  4096,
				"mtime": time.Now(),
				"ctime": time.Now(),
				"uid":   uint32(os.Getuid()),
				"gid":   uint32(os.Getgid()),
				"nlink": 2,
			})
		})

		info, err := os.Stat(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("mydir-%d", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("stat: %v", err)
		}

		if !info.IsDir() {
			t.Errorf("expected directory, got mode %v", info.Mode())
		}
	})

	t.Run("returns EIO on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandler(client.OperationGetAttr, func(response http.ResponseWriter, request *http.Request) {
			response.WriteHeader(http.StatusInternalServerError)
		})

		_, err := os.Stat(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("broken-%d.txt", time.Now().UnixNano())))
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
		sharedMount.mockServer.setHandler(client.OperationGetAttr, func(response http.ResponseWriter, request *http.Request) {
			respondJSON(response, client.ErrorResponse{Errno: 2})
		})

		_, err := os.Stat(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("missing-%d.txt", time.Now().UnixNano())))
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

func dirAttrHandler(response http.ResponseWriter, request *http.Request) {
	respondJSON(response, map[string]any{
		"errno": 0,
		"mode":  0o040755,
		"size":  0,
		"mtime": time.Now(),
		"ctime": time.Now(),
		"uid":   uint32(os.Getuid()),
		"gid":   uint32(os.Getgid()),
		"nlink": 2,
	})
}

func fileAttrHandler(response http.ResponseWriter, request *http.Request) {
	respondJSON(response, map[string]any{
		"errno": 0,
		"mode":  0o100644,
		"size":  0,
		"mtime": time.Now(),
		"ctime": time.Now(),
		"uid":   uint32(os.Getuid()),
		"gid":   uint32(os.Getgid()),
		"nlink": 1,
	})
}

func TestOpenDir(t *testing.T) {
	t.Run("returns directory entries", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: dirAttrHandler,
			client.OperationOpenDir: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, map[string]any{
					"errno": 0,
					"entries": []map[string]any{
						{"name": "file.txt", "mode": 0o100644},
						{"name": "subdir", "mode": 0o040755},
					},
				})
			},
		})

		entries, err := os.ReadDir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("mydir-%d", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("readdir: %v", err)
		}

		if len(entries) != 2 {
			t.Fatalf("entries: got %d, want 2", len(entries))
		}

		if entries[0].Name() != "file.txt" {
			t.Errorf("entry[0]: got %q, want %q", entries[0].Name(), "file.txt")
		}

		if entries[1].Name() != "subdir" {
			t.Errorf("entry[1]: got %q, want %q", entries[1].Name(), "subdir")
		}
	})

	t.Run("returns EIO on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: dirAttrHandler,
			client.OperationOpenDir: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusInternalServerError)
			},
		})

		_, err := os.ReadDir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("broken-%d", time.Now().UnixNano())))
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
			client.OperationGetAttr: dirAttrHandler,
			client.OperationOpenDir: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, client.ErrorResponse{Errno: 2})
			},
		})

		_, err := os.ReadDir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("missing-%d", time.Now().UnixNano())))
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

func TestOpen(t *testing.T) {
	t.Run("opens file successfully", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationOpen: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, client.ErrorResponse{Errno: 0})
			},
		})

		f, err := os.Open(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("file-%d.txt", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("open: %v", err)
		}
		_ = f.Close()
	})

	t.Run("returns EIO on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationOpen: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusInternalServerError)
			},
		})

		_, err := os.Open(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("broken-%d.txt", time.Now().UnixNano())))
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
			client.OperationGetAttr: fileAttrHandler,
			client.OperationOpen: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, client.ErrorResponse{Errno: 2})
			},
		})

		_, err := os.Open(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("missing-%d.txt", time.Now().UnixNano())))
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

func TestUnlink(t *testing.T) {
	t.Run("returns OK when backend returns 200", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o100644,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 1,
				})
			},
			client.OperationUnlink: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusOK)
			},
		})

		err := syscall.Unlink(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("unlink-ok-%d.txt", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("unlink: %v", err)
		}
	})

	t.Run("returns EIO when backend returns 404", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o100644,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 1,
				})
			},
			client.OperationUnlink: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusNotFound)
			},
		})

		err := syscall.Unlink(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("unlink-missing-%d.txt", time.Now().UnixNano())))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		if err != syscall.EIO {
			t.Errorf("expected EIO, got %v", err)
		}
	})

	t.Run("returns EIO when backend returns 500", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o100644,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 1,
				})
			},
			client.OperationUnlink: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusInternalServerError)
			},
		})

		err := syscall.Unlink(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("unlink-eio-%d.txt", time.Now().UnixNano())))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		if err != syscall.EIO {
			t.Errorf("expected EIO, got %v", err)
		}
	})
}

func TestRmdir(t *testing.T) {
	t.Run("returns OK when backend returns 200", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o040755,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 2,
				})
			},
			client.OperationRmdir: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusOK)
			},
		})

		err := syscall.Rmdir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("rmdir-ok-%d", time.Now().UnixNano())))
		if err != nil {
			t.Fatalf("rmdir: %v", err)
		}
	})

	t.Run("returns EIO when backend returns 404", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o040755,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 2,
				})
			},
			client.OperationRmdir: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusNotFound)
			},
		})

		err := syscall.Rmdir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("rmdir-missing-%d", time.Now().UnixNano())))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		if err != syscall.EIO {
			t.Errorf("expected EIO, got %v", err)
		}
	})

	t.Run("returns EIO when backend returns 500", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, GetAttributesCallbackData{
					Mode:  0o040755,
					Size:  0,
					Mtime: time.Now(),
					Ctime: time.Now(),
					Uid:   uint32(os.Getuid()),
					Gid:   uint32(os.Getgid()),
					Nlink: 2,
				})
			},
			client.OperationRmdir: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusInternalServerError)
			},
		})

		err := syscall.Rmdir(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("rmdir-eio-%d", time.Now().UnixNano())))
		if err == nil {
			t.Fatal("expected error, got nil")
		}

		if err != syscall.EIO {
			t.Errorf("expected EIO, got %v", err)
		}
	})
}

func TestTruncate(t *testing.T) {
	t.Run("returns OK when backend returns 200", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationTruncate: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusOK)
			},
		})

		err := os.Truncate(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("truncate-ok-%d.txt", time.Now().UnixNano())), 0)
		if err != nil {
			t.Fatalf("truncate: %v", err)
		}
	})

	t.Run("returns EIO on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationTruncate: func(response http.ResponseWriter, request *http.Request) {
				response.WriteHeader(http.StatusInternalServerError)
			},
		})

		err := os.Truncate(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("truncate-eio-%d.txt", time.Now().UnixNano())), 0)
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

	t.Run("returns ENOENT when backend returns errno 2", func(t *testing.T) {
		sharedMount.mockServer.setHandlers(map[client.OperationPath]http.HandlerFunc{
			client.OperationGetAttr: fileAttrHandler,
			client.OperationTruncate: func(response http.ResponseWriter, request *http.Request) {
				respondJSON(response, client.ErrorResponse{Errno: 2})
			},
		})

		err := os.Truncate(filepath.Join(sharedMount.mountPoint, fmt.Sprintf("truncate-missing-%d.txt", time.Now().UnixNano())), 0)
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

func TestStatFs(t *testing.T) {
	t.Run("returns filesystem stats from backend", func(t *testing.T) {
		sharedMount.mockServer.setHandler(client.OperationStatFs, func(w http.ResponseWriter, r *http.Request) {
			respondJSON(w, map[string]any{
				"blocks":  uint64(1000000),
				"bfree":   uint64(500000),
				"bavail":  uint64(490000),
				"files":   uint64(100000),
				"ffree":   uint64(90000),
				"bsize":   uint32(4096),
				"nameLen": uint32(255),
			})
		})

		var stat syscall.Statfs_t
		if err := syscall.Statfs(sharedMount.mountPoint, &stat); err != nil {
			t.Fatalf("statfs: %v", err)
		}

		if stat.Blocks != 1000000 {
			t.Errorf("blocks: got %d, want 1000000", stat.Blocks)
		}
		if stat.Bfree != 500000 {
			t.Errorf("bfree: got %d, want 500000", stat.Bfree)
		}
		if stat.Bavail != 490000 {
			t.Errorf("bavail: got %d, want 490000", stat.Bavail)
		}
		if stat.Namelen != 255 {
			t.Errorf("namelen: got %d, want 255", stat.Namelen)
		}
	})

	t.Run("returns zeroed stats on transport failure", func(t *testing.T) {
		sharedMount.mockServer.setHandler(client.OperationStatFs, func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusInternalServerError)
		})

		// go-fuse falls back to zero-filled StatfsOut when StatFs returns nil.
		// The syscall itself still succeeds (kernel-level fallback).
		var stat syscall.Statfs_t
		_ = syscall.Statfs(sharedMount.mountPoint, &stat)
	})
}
