package computation_server

import (
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/jwt-go"
	"net/http"
	"strconv"
)

func (s *ComputationServer) pushTask(writer http.ResponseWriter, request *http.Request, claims jwt.Claims) {
	taskTitle, _ := claims.GetString("task_title")
	taskType, _ := claims.GetInt64("task_type")
	ownerId, _ := claims.GetInt64("owner_id")

	_, err := s.DbClient.CreateTask(int(s.queueId), taskTitle, int(taskType), int(ownerId))
	if err != nil {
		server.Error(writer, err.Error(), http.StatusInternalServerError)
	} else {
		err := server.Response(writer, `{"detail": "task has been added to queue"}`, http.StatusOK)
		if err != nil {
			server.Error(writer, err.Error(), http.StatusInternalServerError)
		}
	}
}

func (s *ComputationServer) popTask(writer http.ResponseWriter, request *http.Request, claims jwt.Claims) {
	taskId, _ := claims.GetInt64("task_id")

	// TODO: stop task execution

	err := server.Response(writer, `{"detail": "task with id ` + strconv.Itoa(int(taskId)) + ` has been stopped"}`, http.StatusOK)
	if err != nil {
		server.Error(writer, err.Error(), http.StatusInternalServerError)
	}
}
