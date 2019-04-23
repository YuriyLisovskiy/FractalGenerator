package fractals

import "github.com/YuriyLisovskiy/LoadBalancer/util"

type Fractal interface {
	Generate(*util.AsyncMap) error
	HandleProgress(func(int) error) error
	IsFinished() bool
	Path() string
}
