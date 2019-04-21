package load_balancer_server

import (
	"encoding/json"
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/jwt-go"
	"net/http"
)

type serverInfo struct {
	ServeHost string `json:"remote_host"`
	ServePort int    `json:"remote_port"`
}

func sendServerInfo(writer http.ResponseWriter, host string, port int) {
	si := serverInfo {
		ServeHost: host,
		ServePort: port,
	}
	out, err := json.Marshal(si)
	if err != nil {
		server.Error(writer, "Internal Server Error", http.StatusInternalServerError)
	} else {
		err = server.Response(writer, string(out), http.StatusOK)
		if err != nil {
			server.Error(writer, "Internal Server Error", http.StatusInternalServerError)
			fmt.Println(err)
		}
	}
}

func (s *ServerManager) getServer(writer http.ResponseWriter, request *http.Request, claims jwt.Claims) {
	availableServer, err := s.DbClient.GetAvailableServer()
	if err == nil && availableServer.ServersAmount >= settings.MAX_SUB_SERVERS {
		sendServerInfo(writer, availableServer.ServerHost, availableServer.ServerPort)
	} else {
		host, port, err := s.startComputationServer()
		if err != nil {
			server.Error(writer, "Internal Server Error", http.StatusInternalServerError)
			fmt.Println(err)
		} else {
			sendServerInfo(writer, host, port)
		}
	}
}
