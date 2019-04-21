package fractals

type Fractal interface {
	Generate() error
	HandleProgress(handler func (int) error) error
	IsFinished() bool
}
