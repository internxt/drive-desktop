package client

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"log/slog"
	"net"
	"net/http"
	"time"

	"github.com/hanwen/go-fuse/v2/fuse"
)


type Client struct {
	http       *http.Client
	socketPath string
}

func NewClient(socketPath string) *Client {
	return &Client{
		http:       NewUnixSocketClient(socketPath),
		socketPath: socketPath,
	}
}

func NewUnixSocketClient(socketPath string) *http.Client {
	return &http.Client{
		Transport: &http.Transport{
			DialContext: func(ctx context.Context, _, _ string) (net.Conn, error) {
				return (&net.Dialer{}).DialContext(ctx, "unix", socketPath)
			},
		},
	}
}

// NotifyReady sends POST /daemon/ready to Electron to signal the daemon is up.
func (client *Client) NotifyReady(logger *slog.Logger) error {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "http://localhost/daemon/ready", nil)
	if err != nil {
		return fmt.Errorf("creating ready request: %w", err)
	}

	resp, err := client.http.Do(req)
	if err != nil {
		return fmt.Errorf("sending ready request: %w", err)
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("unexpected status from ready endpoint: %d", resp.StatusCode)
	}

	logger.Info("notified electron of readiness")
	return nil
}

// Post sends a JSON body to the given operation path and returns an errno.
// A non-200 HTTP response means a transport failure so we return fuse.EIO without reading the body.
// uppon 200, the response always contains an errno field: non-zero means the operation failed with that errno,
// zero means success and the remaining fields are the operation's data, unmarshalled into out if non-nil.
func (client *Client) Post(context context.Context, path OperationPath, in any, out any) fuse.Status {
	body, err := json.Marshal(in)
	if err != nil {
		return fuse.EIO
	}
	url := serverURL + string(path)
	req, err := http.NewRequestWithContext(context, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return fuse.EIO
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.http.Do(req)
	if err != nil {
		return fuse.EIO
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fuse.EIO
	}

	resBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return fuse.EIO
	}

	var errResp ErrorResponse
	if err = json.Unmarshal(resBody, &errResp); err == nil && errResp.Errno != 0 {
		return fuse.Status(errResp.Errno)
	}

	if out != nil {
		if err = json.Unmarshal(resBody, out); err != nil {
			return fuse.EIO
		}
	}

	return fuse.OK
}

// PostBinary sends a JSON body to the given operation path and returns raw binary data.
// Errors are signaled via the X-Errno response header (non-zero = fuse.Status error code).
// On success (X-Errno: 0) the response body is raw bytes copied into dest.
// Returns the number of bytes read and a fuse.Status.
func (client *Client) PostBinary(ctx context.Context, path OperationPath, in any, dest []byte) (int, fuse.Status) {
	body, err := json.Marshal(in)
	if err != nil {
		return 0, fuse.EIO
	}
	url := serverURL + string(path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(body))
	if err != nil {
		return 0, fuse.EIO
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := client.http.Do(req)
	if err != nil {
		return 0, fuse.EIO
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return 0, fuse.EIO
	}

	if errnoStr := resp.Header.Get("X-Errno"); errnoStr != "" && errnoStr != "0" {
		var errno int32
		if _, err := fmt.Sscanf(errnoStr, "%d", &errno); err == nil && errno != 0 {
			return 0, fuse.Status(errno)
		}
	}

	bytesRead, err := io.ReadFull(resp.Body, dest)
	if err != nil && err != io.ErrUnexpectedEOF {
		return 0, fuse.EIO
	}
	return bytesRead, fuse.OK
}

// PostBinaryRequest sends raw binary payload to the given operation path.
// Errors are signaled via the X-Errno response header (non-zero = fuse.Status error code).
// On success it returns fuse.OK.
func (client *Client) PostSendBinary(ctx context.Context, path OperationPath, payload []byte, headers map[string]string) fuse.Status {
	url := serverURL + string(path)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewBuffer(payload))
	if err != nil {
		return fuse.EIO
	}
	req.Header.Set("Content-Type", "application/octet-stream")
	for key, value := range headers {
		req.Header.Set(key, value)
	}

	resp, err := client.http.Do(req)
	if err != nil {
		return fuse.EIO
	}
	defer func() { _ = resp.Body.Close() }()

	if resp.StatusCode != http.StatusOK {
		return fuse.EIO
	}

	if errnoStr := resp.Header.Get("X-Errno"); errnoStr != "" && errnoStr != "0" {
		var errno int32
		if _, err := fmt.Sscanf(errnoStr, "%d", &errno); err == nil && errno != 0 {
			return fuse.Status(errno)
		}
		return fuse.EIO
	}

	return fuse.OK
}
