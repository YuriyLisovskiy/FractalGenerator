package fractals

type Fractal interface {
	Generate(*map[int64]bool) error
	HandleProgress(func(int) error) error
	IsFinished() bool
	Path() string
}
