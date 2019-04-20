package db

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	_ "github.com/lib/pq"
	"sync"
)

type Client struct {
	db *sql.DB
}

var instance Client

var once sync.Once

func New() Client {
	once.Do(func() {
		connectionString := fmt.Sprintf(
			"host=%s port=%d user=%s password=%s dbname=%s sslmode=disable",
			settings.DB_HOST, settings.DB_PORT, settings.DB_USER, settings.DB_PASSWORD, settings.DB_NAME,
		)
		db, err := sql.Open("postgres", connectionString)
		if err != nil {
			panic(err)
		}
		instance = Client{db: db}
	})
	return instance
}

func (c *Client) GetAvailableServer() (ServerQueue, error) {
	var (
		id            int
		serverHost    string
		serverPort    int
		tasksCount    int
		serversAmount int
	)
	err := c.db.QueryRow(SqlGetAvailableServer).Scan(&id, &serverHost, &serverPort, &tasksCount, &serversAmount)
	if err != nil {
		return ServerQueue{}, errors.New(fmt.Sprintf("Query %s failed: %s", SqlGetAvailableServer, err.Error()))
	}
	return ServerQueue{id, serverHost, serverPort, tasksCount, serversAmount}, nil
}

func (c *Client) CleanServerQueues() error {
	_, err := c.db.Exec(SqlDeleteAllFromServerQueues)
	return err
}

func (c *Client) CreateServerQueue(host string, port int) (int, error) {
	var lastId int
	err := c.db.QueryRow(SqlCreateServerQueue, host, port).Scan(&lastId)
	if err != nil {
		return -1, err
	}
	return lastId, nil
}

func (c *Client) DeleteServerQueue(host string, port int) error {
	_, err := c.db.Exec(SqlDeleteServerQueue, host, port)
	return err
}

func (c *Client) CreateTask(queueId int, taskTitle string, taskType int, ownerId int) (int, error) {
	var lastId int
	err := c.db.QueryRow(SqlCreateTask, queueId, taskTitle, taskType, ownerId).Scan(&lastId)
	if err != nil {
		return -1, err
	}
	return lastId, nil
}
