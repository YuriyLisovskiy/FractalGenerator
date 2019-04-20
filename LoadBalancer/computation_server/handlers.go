package computation_server

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

type taskData struct {
	taskTitle string
	taskType  int
	ownerId   int
}

func (s *ComputationServer) pushTask(writer http.ResponseWriter, request *http.Request) {
	decoder := json.NewDecoder(request.Body)
	var data taskData
	err := decoder.Decode(&data)
	if err != nil {
		http.Error(writer, err.Error(), http.StatusBadRequest)
	} else {
		fmt.Println(s.DbClient.CreateTask(int(s.queueId), data.taskTitle, data.taskType, data.ownerId))
		if err != nil {
			http.Error(writer, err.Error(), http.StatusBadRequest)
		} else {
			_, _ = io.WriteString(writer, fmt.Sprintf("It's Computation Server: %s:%d", s.host, s.port))
		}
	}
}
