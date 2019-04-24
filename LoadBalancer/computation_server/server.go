package computation_server

import (
	"context"
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"net/http"
)

type ComputationServer struct {
	host         string
	port         int
	DbClient     db.Client
	Server       http.Server
	QueueId      int
	runningTasks int
	interrupt    *util.AsyncMap
	isRunning    bool
}

func New(host string, port int) (ComputationServer, error) {
	cs := ComputationServer{
		host:         host,
		port:         port,
		DbClient:     db.New(),
		runningTasks: 0,
		interrupt:    util.NewAsyncMap(),
		isRunning:    true,
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

	mux["/task/push"] = server.Request(s.pushTask, "POST", "task_type", "width", "height", "max_iterations", "owner_id")
	mux["/task/pop"] = server.Request(s.popTask, "POST", "task_id")

	return &mux
}

func (s *ComputationServer) CleanUp() error {
	return s.DbClient.DeleteServerQueue(s.host, s.port)
}

func (s *ComputationServer) Initialize() error {
	queueId, err := s.DbClient.CreateServerQueue(s.host, s.port)
	if err == nil {
		s.QueueId = queueId
	}
	return err
}

func (s *ComputationServer) HasTasks() bool {
	return s.runningTasks > 0
}

func (s *ComputationServer) Stop() error {
	s.isRunning = false
	if err := s.Server.Shutdown(context.Background()); err != nil {
		return err
	}
	return nil
}
