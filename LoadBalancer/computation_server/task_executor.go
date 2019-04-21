package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/db"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"time"
)

func (s *ComputationServer) executeTask(task db.TaskItem) {
	_, err := s.DbClient.UpdateTask(task.Id, task.Progress, "Running")
	if err == nil {
		s.runningTasks++
		go func() {
			for p := 0; p < 100; p++ {
				_, err = s.DbClient.UpdateTask(task.Id, p, "Running")
				if err != nil {
					fmt.Println(err)
				} else {
					time.Sleep(500 * time.Millisecond)
				}
			}
			_, _ = s.DbClient.UpdateTask(task.Id, 100, "Finished")
			s.runningTasks--
		}()
	} else {
		fmt.Println(err)
	}
}

func (s *ComputationServer) InitTaskExecutor() error {
	queuedTasks, err := s.DbClient.GetTasks(s.queueId, "In Queue", settings.MAX_TASKS_PER_SERVER)
	if err != nil {
		return err
	}
	for i := 0; i < settings.MAX_TASKS_PER_SERVER && !queuedTasks.IsEmpty(); i++ {
		taskObj := queuedTasks.Pop()
		task := taskObj.(db.TaskItem)
		s.executeTask(task)
	}
	go func() {
		for {
			if s.runningTasks < settings.MAX_TASKS_PER_SERVER {
				queuedTasks, err := s.DbClient.GetTasks(s.queueId, "In Queue", settings.MAX_TASKS_PER_SERVER)
				if err == nil {
					for s.runningTasks < settings.MAX_TASKS_PER_SERVER && !queuedTasks.IsEmpty() {
						taskObj := queuedTasks.Pop()
						task := taskObj.(db.TaskItem)
						s.executeTask(task)
					}
				} else {
					fmt.Println(err)
				}
			}
			time.Sleep(1 * time.Second)
		}
	}()
	return nil
}
