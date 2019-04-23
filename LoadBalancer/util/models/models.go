package models

import (
	"github.com/YuriyLisovskiy/LoadBalancer/util/fractals"
)

type TaskType int

const (
	MandelbrotSet = iota + 1
	QuasiCrystal
)

type TaskItem struct {
	Id            int
	Title         string
	OwnerId       int
	Progress      int
	Status        string
	Fractal       int
	QueueId       int
	TaskType      int
	Width         int
	Height        int
	MaxIterations int

	Generator fractals.Fractal
}

func TypeToTitle(taskType TaskType) string {
	switch taskType {
	case MandelbrotSet:
		return "Mandelbrot Set"
	case QuasiCrystal:
		return "Quasi Crystal"
	default:
		return ""
	}
}
