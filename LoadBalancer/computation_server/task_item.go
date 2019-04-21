package computation_server

type TaskItem struct {
	Id       int
	Title    string
	OwnerId  int
	Progress int
	Status   string
	Fractal  int
	QueueId  int
	TaskType int
}
