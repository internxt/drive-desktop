package client

type OperationPath string

type ErrorResponse struct {
	Errno int32 `json:"errno"`
}

const (
	OperationGetAttr  OperationPath = "/op/getattributes"
	OperationOpen     OperationPath = "/op/open"
	OperationOpenDir  OperationPath = "/op/opendir"
	OperationRead     OperationPath = "/op/read"
	OperationTruncate OperationPath = "/op/truncate"
	OperationCreate   OperationPath = "/op/create"
	OperationWrite    OperationPath = "/op/write"
	OperationRelease  OperationPath = "/op/release"
	OperationMkdir    OperationPath = "/op/mkdir"
	OperationRename   OperationPath = "/op/rename"
	OperationUnlink   OperationPath = "/op/unlink"
	OperationRmdir    OperationPath = "/op/rmdir"
	OperationStatFs   OperationPath = "/op/statfs"
)

const serverURL = "http://localhost"
