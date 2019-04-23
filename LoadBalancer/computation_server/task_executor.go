package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util/models"
	"os"
	"time"
)

func (s *ComputationServer) executeTask(task models.TaskItem) {
	_, err := s.DbClient.UpdateTask(task.Id, task.Progress, "Running")
	if err == nil {
		s.runningTasks++
		go func() {
			ticker := time.NewTicker(500 * time.Millisecond)
			defer ticker.Stop()
			for !task.Generator.IsFinished() {
				select {
				case <- ticker.C:
					err := task.Generator.HandleProgress(func(progress int) error {
						status := "Running"
						if progress >= 100 {
							progress = 99
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
				}
			}
		}()
		go func() {
			if task.Generator.Generate(&s.interrupt) != nil {
				fmt.Println(err)
			}
			if s.interrupt[int64(task.Id)] {
				fmt.Println(fmt.Sprintf("INTERRUPTED: %d", task.Id))
			} else {
				fmt.Println("Finished")
				s.runningTasks--
				err = sendFractal(task)
				if err != nil {
					fmt.Println(err)
				} else {
					_, err = s.DbClient.UpdateTask(task.Id, 100, "Finished")
					if err != nil {
						fmt.Println(err)
					}
					if os.Remove(task.Generator.Path()) != nil {
						fmt.Println(err)
					}
				}
			}
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
		s.interrupt[int64(task.Id)] = false
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
						s.interrupt[int64(task.Id)] = false
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
