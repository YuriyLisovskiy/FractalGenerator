package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util/models"
	"time"
)

func (s *ComputationServer) executeTask(task models.TaskItem) {
	_, err := s.DbClient.UpdateTask(task.Id, task.Progress, "Running")
	if err == nil {
		s.runningTasks++
		go func() {
			for !task.Generator.IsFinished() {
				err := task.Generator.HandleProgress(func(progress int) error {
					status := "Running"
					if progress >= 100 {
						status = "Finished"
						progress = 100
					}
					_, err = s.DbClient.UpdateTask(task.Id, progress, status)
					if err != nil {
						return err
					}
					return nil
				})
				if err != nil {
					fmt.Println(err)
				}
				time.Sleep(500 * time.Millisecond)
			}
		}()
		go func() {
			if task.Generator.Generate() != nil {
				fmt.Println(err)
			}
			fmt.Println("Finished")
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
		task := taskObj.(models.TaskItem)
		s.executeTask(task)
	}
	go func() {
		for {
			if s.runningTasks < settings.MAX_TASKS_PER_SERVER {
				queuedTasks, err := s.DbClient.GetTasks(s.queueId, "In Queue", settings.MAX_TASKS_PER_SERVER)
				if err == nil {
					for s.runningTasks < settings.MAX_TASKS_PER_SERVER && !queuedTasks.IsEmpty() {
						taskObj := queuedTasks.Pop()
						task := taskObj.(models.TaskItem)
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
