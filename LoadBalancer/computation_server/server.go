package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"net/http"
)

type ComputationServer struct {
	host         string
	port         int
	DbClient     db.Client
	Server       http.Server
	queueId      int
	runningTasks int
}

func New(host string, port int) (ComputationServer, error) {
	cs := ComputationServer{
		host:     host,
		port:     port,
		DbClient: db.New(),
		runningTasks: 0,
	}
	err := cs.Initialize()
	if err != nil {
		return cs, err
	}
	cs.Server = server.NewServer(host, port, cs.getHandlers())
	fmt.Printf("[INFO] Starting computation server at http://%s:%d/\n", host, port)
	return cs, nil
}

func (s *ComputationServer) getHandlers() *map[string]func(http.ResponseWriter, *http.Request) {
	mux := make(map[string]func(http.ResponseWriter, *http.Request))

	mux["/task/push"] = server.Request(s.pushTask, "POST", "task_title", "task_type", "owner_id")
	mux["/task/pop"] = server.Request(s.popTask, "POST", "task_id")

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
