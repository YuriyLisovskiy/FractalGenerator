package db

import "fmt"

type ServerQueue struct {
	id            int
	ServerHost    string
	ServerPort    int
	tasksCount    int
	ServersAmount int
}

func (sq ServerQueue) String() string {
	return fmt.Sprintf("Server: id=%d, host='%s', port=%d", sq.id, sq.ServerHost, sq.ServerPort)
}
