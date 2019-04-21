package db

import (
	"database/sql"
	"errors"
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"github.com/YuriyLisovskiy/LoadBalancer/util/fractals"
	"github.com/YuriyLisovskiy/LoadBalancer/util/models"
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

func (c *Client) CreateTask(queueId int, taskType int, width int, height int, maxIterations int, ownerId int) (int, error) {
	var lastId int
	err := c.db.QueryRow(
		SqlCreateTask, queueId, models.TypeToTitle(models.TaskType(taskType)), taskType, width, height, maxIterations, ownerId,
	).Scan(&lastId)
	if err != nil {
		return -1, err
	}
	return lastId, nil
}

func (c *Client) UpdateTask(taskId int, progress int, status string) (int, error) {
	var lastId int
	err := c.db.QueryRow(SqlUpdateTask, taskId, progress, status).Scan(&lastId)
	if err != nil {
		return -1, err
	}
	return lastId, nil
}

func (c *Client) GetTasks(queueId int, status string, limit int) (util.Queue, error) {
	rows, err := c.db.Query(SqlGetTasksByQueueAndStatus, queueId, status, limit)
	if err != nil {
		return util.Queue{}, errors.New(fmt.Sprintf("Query %s failed: %s", SqlGetTasksByQueueAndStatus, err.Error()))
	}
	defer rows.Close()
	tasks := util.NewQueue()
	for rows.Next() {
		var fractalId interface{}
		task := models.TaskItem{}
		err := rows.Scan(
			&task.Id, &task.Title, &task.OwnerId,
			&task.Progress, &task.Status, &fractalId,
			&task.QueueId, &task.TaskType, &task.Width,
			&task.Height, &task.MaxIterations,
		)
		var generator fractals.Fractal
		switch task.TaskType {
		default:
			ms := fractals.NewMandelbrotSet(task.Width, task.Height, task.MaxIterations)
			generator = &ms
		}
		task.Generator = generator
		if err == nil {
			if fractalId != nil {
				task.Fractal = fractalId.(int)
			}
			tasks.Push(task)
		} else {
			fmt.Println(err)
		}
	}
	err = rows.Err()
	if err != nil {
		return tasks, err
	}
	return tasks, nil
}
