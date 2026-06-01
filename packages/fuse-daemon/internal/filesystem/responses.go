package filesystem

import "time"

type GetAttributesCallbackData struct {
	Mode  uint32     `json:"mode"`
	Size  uint64     `json:"size"`
	Mtime time.Time  `json:"mtime"`
	Ctime time.Time  `json:"ctime"`
	Atime *time.Time `json:"atime,omitempty"`
	Uid   uint32     `json:"uid"`
	Gid   uint32     `json:"gid"`
	Nlink uint32     `json:"nlink"`
}

type OpenDirEntry struct {
	Name string `json:"name"`
	Mode uint32 `json:"mode"`
}

type OpenDirCallbackData struct {
	Entries []OpenDirEntry `json:"entries"`
}

type StatFsCallbackData struct {
	Blocks  uint64 `json:"blocks"`
	Bfree   uint64 `json:"bfree"`
	Bavail  uint64 `json:"bavail"`
	Files   uint64 `json:"files"`
	Ffree   uint64 `json:"ffree"`
	Bsize   uint32 `json:"bsize"`
	NameLen uint32 `json:"nameLen"`
}
