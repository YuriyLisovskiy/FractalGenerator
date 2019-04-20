package load_balancer_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/computation_server"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"net/http"
)

type ServerManager struct {
	DbClient    db.Client
	NextPort int
}

func New() ServerManager {
	fmt.Printf(
		"Starting server manager at http://%s:%d/\nQuit the server with CONTROL-C.",
		settings.HOST, settings.PORT,
	)
	return ServerManager {
		DbClient: db.New(),
		NextPort: 3000,
	}
}

func (s *ServerManager) Initialize() error {
	err := s.DbClient.CleanServerQueues()
	if err != nil {
		return err
	}
	return nil
}

func (s *ServerManager) GetHandlers() *map[string]func(http.ResponseWriter, *http.Request) {
	mux := make(map[string]func(http.ResponseWriter, *http.Request))

	mux["/get/server"] = server.Request(s.getServer, "GET")

	return &mux
}

func (s *ServerManager) startComputationServer() (string, int, error) {
	computationServer := computation_server.New(settings.HOST, s.NextPort)
	err := computationServer.Initialize()
	if err != nil {
		return "", 0, err
	}
	srv := server.NewServer(settings.HOST, s.NextPort, computationServer.GetHandlers())
	fmt.Printf(
		"Starting computation server at http://%s:%d/",
		settings.HOST, s.NextPort,
	)
	go func(host string, port int) {
		err = srv.ListenAndServe()
		if err != nil {
			fmt.Println(err)
			s.NextPort--
			return
		}
		err = computationServer.CleanUp()
		if err != nil {
			fmt.Println(err)
		}
		s.NextPort--
	}(settings.HOST, s.NextPort)
	s.NextPort++
	return settings.HOST, s.NextPort - 1, nil
}
