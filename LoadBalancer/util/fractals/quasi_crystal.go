package fractals

import (
	"errors"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"image"
	"image/color"
	"image/png"
	"math"
	"math/rand"
	"os"
	"strconv"
	"time"
)

type QuasiCrystal struct {
	imgX int
	imgY int

	taskId     int64
	name       string
	progress   int
	isFinished bool
}

func NewQuasiCrystal(taskId int64, x int, y int, nameAppendix string) QuasiCrystal {
	return QuasiCrystal{
		taskId:     taskId,
		imgX:       x,
		imgY:       y,
		name:       "QuasiCrystalFractal_" + nameAppendix + "_" + strconv.Itoa(int(time.Now().Unix())),
		progress:   0,
		isFinished: false,
	}
}

func (qc *QuasiCrystal) Generate(stopList *util.AsyncMap) error {
	img := image.NewRGBA(image.Rect(0, 0, qc.imgX, qc.imgY))
	f := (0+rand.Float64()*(1-0))*40 + 10
	p := rand.Float64() * math.Pi
	n := rand.Intn(20-10) + 10
	progress := util.NewProgress(
		1, float32(0), float32(qc.imgY), float32(qc.imgX), float32(n),
	)
	for ky := 0; ky < qc.imgY && !stopList.Read(qc.taskId); ky++ {
		y := float64(ky)/(float64(qc.imgY)-1)*4*math.Pi - 2*math.Pi
		for kx := 0; kx < qc.imgX && !stopList.Read(qc.taskId); kx++ {
			x := float64(kx)/(float64(qc.imgX)-1)*4*math.Pi - 2*math.Pi
			z := 0.0
			for i := 0; i < n && !stopList.Read(qc.taskId); i++ {
				r := math.Hypot(x, y)
				a := math.Atan2(y, x) + float64(i)*math.Pi*float64(2.0)/float64(n)
				z += math.Cos(r*math.Sin(a)*f + p)
				qc.progress = progress.Calculate(float32(ky), float32(kx), float32(i))
			}
			c := uint8(math.Round(float64(255) * z / float64(n)))
			img.Set(kx, ky, color.RGBA{R: c, G: c, B: c, A: 255})
		}
	}
	if stopList.Read(qc.taskId) {
		qc.isFinished = true
		return errors.New("INTERRUPTED BY USER")
	}
	qc.progress = 100
	file, err := os.OpenFile(qc.Path(), os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		qc.isFinished = true
		return err
	}
	err = png.Encode(file, img)
	if err != nil {
		qc.isFinished = true
		return err
	}
	err = file.Close()
	if err != nil {
		qc.isFinished = true
		return err
	}
	qc.isFinished = true
	return nil
}

func (qc *QuasiCrystal) HandleProgress(handler func(int) error) error {
	return handler(qc.progress)
}

func (qc *QuasiCrystal) IsFinished() bool {
	return qc.isFinished
}

func (qc *QuasiCrystal) Path() string {
	return settings.MediaDirectory + qc.name + ".png"
}
