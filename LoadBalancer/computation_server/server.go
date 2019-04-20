package computation_server

import (
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"net/http"
)

type ComputationServer struct {
	host     string
	port     int
	DbClient db.Client
	queueId  int
}

func New(host string, port int) ComputationServer {
	return ComputationServer {
		host:     host,
		port:     port,
		DbClient: db.New(),
	}
}

func (s *ComputationServer) GetHandlers() *map[string]func(http.ResponseWriter, *http.Request) {
	mux := make(map[string]func(http.ResponseWriter, *http.Request))

	mux["/task/push"] = server.Request(s.pushTask, "POST", "task_title", "task_type", "owner_id")

	return &mux
}

func (s *ComputationServer) CleanUp() error {
	return s.DbClient.DeleteServerQueue(s.host, s.port)
}

func (s *ComputationServer) Initialize() error {
	queueId, err := s.DbClient.CreateServerQueue(s.host, s.port)
	if err == nil {
		s.queueId = queueId
	}
	return err
}
