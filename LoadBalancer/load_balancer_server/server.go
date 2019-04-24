package load_balancer_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/computation_server"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"log"
	"net/http"
	"time"
)

type ServerManager struct {
	DbClient    db.Client
	NextPort int
}

func New() ServerManager {
	fmt.Printf(
		"[INFO] Starting server manager at http://%s:%d/\nQuit the server with CONTROL-C.",
		settings.HOST, settings.PORT,
	)
	return ServerManager {
		DbClient: db.New(),
		NextPort: settings.PORT + 1,
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

func (s *ServerManager) startComputationServer() (int, string, int, error) {
	srv, err := computation_server.New(settings.HOST, s.NextPort)
	if err != nil {
		return 0, "", 0, err
	}
	err = srv.InitTaskExecutor()
	if err != nil {
		fmt.Println(err)
		s.NextPort--
		return 0, "", 0, err
	} else {
		go func() {
			timer := util.NewTimer(1 * time.Second, settings.COMPUTATION_SERVER_TIMEOUT)
			for {
				if srv.HasTasks() {
					timer.Reset()
				} else {
					if timer.Finished() {
						if err := srv.Stop(); err != nil {
							log.Println(err)
						}
						log.Println("Server is stopped due to timeout")
						return
					}
				}
			}
		}()
		go func(host string, port int) {
			err = srv.Server.ListenAndServe()
			if err != nil {
				fmt.Println(err)
			}
			err = srv.CleanUp()
			if err != nil {
				fmt.Println(err)
			}
			s.NextPort--
		}(settings.HOST, s.NextPort)
		s.NextPort++
		return srv.QueueId, settings.HOST, s.NextPort - 1, nil
	}
}
