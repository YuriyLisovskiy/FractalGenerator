package manager_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"io"
	"net/http"
)

func (s *ServerManager) getServer(writer http.ResponseWriter, request *http.Request) {
	availableServer, err := s.DbClient.GetAvailableServer()
	if err == nil && availableServer.ServersAmount >= settings.MAX_SUB_SERVERS {
		_, err = io.WriteString(writer, "Got server: " + availableServer.String())
		if err != nil {
			http.Error(writer, "Internal Server Error", http.StatusInternalServerError)
			fmt.Println(err)
		}
	} else {
		host, port, err := s.startComputationServer()
		if err != nil {
			http.Error(writer, "Internal Server Error", http.StatusInternalServerError)
			fmt.Println(err)
		} else {
			_, err = io.WriteString(writer, fmt.Sprintf("Got server: %s:%d", host, port))
			if err != nil {
				http.Error(writer, "Internal Server Error", http.StatusInternalServerError)
				fmt.Println(err)
			}
		}
	}
}
