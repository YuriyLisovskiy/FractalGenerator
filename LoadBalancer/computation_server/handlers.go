package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"io"
	"net/http"
)

type ComputationServer struct {
	host     string
	port     int
	DbClient db.Client
}

func New(host string, port int) ComputationServer {
	return ComputationServer{
		host:     host,
		port:     port,
		DbClient: db.New(),
	}
}

func (s *ComputationServer) index(writer http.ResponseWriter, request *http.Request) {
	_, err := io.WriteString(writer, fmt.Sprintf("It's Computation Server: %s:%d", s.host, s.port))
	fmt.Println(request.URL.Query())
	if err != nil {
		panic(err)
	}
}

func (s *ComputationServer) GetHandlers() *map[string]func(http.ResponseWriter, *http.Request) {
	mux := make(map[string]func(http.ResponseWriter, *http.Request))

	mux["/"] = server.Request(s.index, "GET")

	return &mux
}

func (s *ComputationServer) CleanUp() error {
	return s.DbClient.DeleteServerQueue(s.host, s.port)
}

func (s *ComputationServer) Initialize() error {
	return s.DbClient.CreateServerQueue(s.host, s.port)
}
