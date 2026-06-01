package filesystem

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"testing"

	"internxt/drive-desktop-linux/fuse-daemon/internal/client"
)

// sharedMount holds the single FUSE mount shared across all tests.
// TestMain initializes it once before any test runs.
// Each test sets its own mock handler via sharedMount.mockServer.setHandler()
// and stats a unique path to avoid kernel attribute cache hits between tests.
var sharedMount struct {
	mountPoint string
	server     interface{ Unmount() error }
	mockServer *mockServer
}

type mockServer struct {
	socket net.Listener
	server *http.Server
}

func newMockServer(socketPath string) (*mockServer, error) {
	socket, err := net.Listen("unix", socketPath)
	if err != nil {
		return nil, fmt.Errorf("listen on unix socket: %w", err)
	}

	serverMock := &mockServer{
		socket: socket,
		server: &http.Server{},
	}

	go serverMock.server.Serve(socket) //nolint:errcheck

	return serverMock, nil
}

// setHandler replaces the current request handler with one that responds to
// the given path using the provided HandlerFunc. Call this at the start of
// each test to control what the daemon receives back from the mock server.
func (serverMock *mockServer) setHandler(path client.OperationPath, handler http.HandlerFunc) {
	serverMock.setHandlers(map[client.OperationPath]http.HandlerFunc{path: handler})
}

func (serverMock *mockServer) setHandlers(handlers map[client.OperationPath]http.HandlerFunc) {
	router := http.NewServeMux()
	for path, handler := range handlers {
		router.HandleFunc(string(path), handler)
	}
	serverMock.server.Handler = router
}

func (serverMock *mockServer) close() {
	_ = serverMock.server.Close()
	_ = serverMock.socket.Close()
}

// respondJSON writes body as a JSON response.
func respondJSON(response http.ResponseWriter, body any) {
	response.Header().Set("Content-Type", "application/json")
	json.NewEncoder(response).Encode(body) //nolint:errcheck
}

// TestMain runs once before all tests. It sets up:
//  1. A temp directory as the FUSE mount point
//  2. A mock http server on a Unix socket
//  3. A real FUSE mount pointing at that socket
//
// All tests share this single mount and swap the mock handler per-test.
func TestMain(runner *testing.M) {
	mountPoint, err := os.MkdirTemp("", "fuse-test-mount-*")
	if err != nil {
		panic("create mount dir: " + err.Error())
	}
	defer func() { _ = os.RemoveAll(mountPoint) }()

	socketPath := filepath.Join(os.TempDir(), "fuse-test.sock")
	_ = os.Remove(socketPath)

	mockServer, err := newMockServer(socketPath)
	if err != nil {
		panic("start mock electron: " + err.Error())
	}
	defer mockServer.close()

	logger := slog.New(slog.NewTextHandler(os.Stderr, nil))
	daemonClient := client.NewClient(socketPath)

	fuseServer, _, err := Mount(mountPoint, logger, daemonClient)
	if err != nil {
		panic("mount fuse: " + err.Error())
	}
	defer fuseServer.Unmount() //nolint:errcheck

	sharedMount.mountPoint = mountPoint
	sharedMount.server = fuseServer
	sharedMount.mockServer = mockServer

	os.Exit(runner.Run())
}
