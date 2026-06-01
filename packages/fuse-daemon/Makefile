.PHONY: build test lint

GOFLAGS ?= -mod=readonly -trimpath -buildvcs=false
LDFLAGS ?= -s -w

build:
	go build $(GOFLAGS) -ldflags="$(LDFLAGS)" -o ../../dist/fuse-daemon ./cmd/daemon

test:
	go test ./...

lint:
	golangci-lint run ./...
