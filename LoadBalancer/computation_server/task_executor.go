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
			for !task.Generator.IsFinished() {
				err := task.Generator.HandleProgress(func(progress int) error {
					if !task.Generator.IsFinished() {
						status := "Running"
						if progress >= 100 {
							progress = 99
						}
						_, err = s.DbClient.UpdateTask(task.Id, progress, status)
						if err != nil {
							return err
						}
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
			err := task.Generator.Generate(s.interrupt)
			if err != nil {
				fmt.Println(err)
			} else {
				fmt.Println("Finished")
				err = sendFractal(task)
				if err != nil {
					fmt.Println(err.Error())
				} else {
					_, err = s.DbClient.UpdateTask(task.Id, 100, "Finished")
					if err != nil {
						fmt.Println(err.Error())
					}
					if os.Remove(task.Generator.Path()) != nil {
						fmt.Println(err.Error())
					}
				}
			}
			s.runningTasks--
		}()
	} else {
		fmt.Println(err)
	}
}

func (s *ComputationServer) InitTaskExecutor() error {
	queuedTasks, err := s.DbClient.GetTasks(s.QueueId, "In Queue", settings.MAX_TASKS_PER_SERVER)
	if err != nil {
		return err
	}
	for i := 0; i < settings.MAX_TASKS_PER_SERVER && !queuedTasks.IsEmpty(); i++ {
		taskObj := queuedTasks.Pop()
		task := taskObj.(models.TaskItem)
		s.interrupt.Write(int64(task.Id), false)
		s.executeTask(task)
	}
	go func() {
		for s.isRunning {
			if s.runningTasks < settings.MAX_TASKS_PER_SERVER {
				queuedTasks, err := s.DbClient.GetTasks(s.QueueId, "In Queue", settings.MAX_TASKS_PER_SERVER)
				if err == nil {
					for s.runningTasks <= settings.MAX_TASKS_PER_SERVER && !queuedTasks.IsEmpty() {
						taskObj := queuedTasks.Pop()
						task := taskObj.(models.TaskItem)
						s.interrupt.Write(int64(task.Id), false)
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
