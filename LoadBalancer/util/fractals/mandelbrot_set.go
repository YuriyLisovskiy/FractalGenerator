package fractals

import (
	"errors"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"image"
	"image/color"
	"image/png"
	"math"
	"math/cmplx"
	"os"
	"strconv"
	"time"
)

type MandelbrotSet struct {
	taskId        int64

	xb            float64
	yb            float64
	ya            float64
	xa            float64
	imgX          int
	imgY          int
	maxAbsX       float64
	maxAbsY       float64
	maxAbsZ       float64
	name          string
	maxIterations int

	progress       int
	isFinished bool
}

func NewMandelbrotSet(taskId int64, x int, y int, maxIterations int, nameAppendix string) MandelbrotSet {
	return MandelbrotSet {
		taskId: taskId,
		xb: 1.0,
		yb: 1.5,
		ya: -1.5,
		xa: -2.0,
		imgX: x,
		imgY: y,
		maxAbsX: 0.0,
		maxAbsY: 0.0,
		maxAbsZ: 0.0,
		name: "MandelbrotSetFractal_" + nameAppendix + "_" + strconv.Itoa(int(time.Now().Unix())),
		maxIterations: maxIterations,
		progress: 0,
		isFinished: false,
	}
}

func (ms *MandelbrotSet) findMaxValues(stopList *util.AsyncMap) error {
	progress := util.NewProgress(2, 0, float32(ms.imgY), float32(ms.imgX), float32(ms.maxIterations))

	for ky := 0; ky < ms.imgY && !stopList.Read(ms.taskId); ky++ {
		b := float64(ky)*(ms.yb-ms.ya)/float64(ms.imgY-1) + ms.ya
		for kx := 0; kx < ms.imgX && !stopList.Read(ms.taskId); kx++ {
			a := float64(kx)*(ms.xb-ms.xa)/float64(ms.imgX-1) + ms.xa
			c := complex(a, b)
			z := complex(a, b)
			for i := 0; i < ms.maxIterations && !stopList.Read(ms.taskId); i++ {
				z = z*z + c
				if cmplx.Abs(z) > 2.0 {
					break
				}
				ms.progress = progress.Calculate(float32(ky), float32(kx), float32(i))
			}
			if math.Abs(real(z)) > ms.maxAbsX {
				ms.maxAbsX = math.Abs(real(z))
			}
			if math.Abs(imag(z)) > ms.maxAbsY {
				ms.maxAbsY = math.Abs(imag(z))
			}
			if cmplx.Abs(z) > ms.maxAbsZ {
				ms.maxAbsZ = cmplx.Abs(z)
			}
		}
	}
	if stopList.Read(ms.taskId) {
		return errors.New("INTERRUPTED BY USER")
	}
	return nil
}

func (ms *MandelbrotSet) Generate(stopList *util.AsyncMap) error {
	img := image.NewRGBA(image.Rect(0, 0, ms.imgX, ms.imgY))
	err := ms.findMaxValues(stopList)
	if err != nil {
		ms.isFinished = true
		return err
	}
	progress := util.NewProgress(
		2, float32(ms.progress), float32(ms.imgY), float32(ms.imgX), float32(ms.maxIterations),
	)
	for ky := 0; ky < ms.imgY && !stopList.Read(ms.taskId); ky++ {
		b := float64(ky)*(ms.yb-ms.ya)/float64(ms.imgY-1) + ms.ya
		for kx := 0; kx < ms.imgX && !stopList.Read(ms.taskId); kx++ {
			a := float64(kx)*(ms.xb-ms.xa)/float64(ms.imgX-1) + ms.xa
			c := complex(a, b)
			z := complex(a, b)
			for i := 0; i < ms.maxIterations && !stopList.Read(ms.taskId); i++ {
				z = z*z + c
				if cmplx.Abs(z) > 2.0 {
					break
				}
				ms.progress = progress.Calculate(float32(ky), float32(kx), float32(i))
			}
			v0 := int(255 * math.Abs(real(z)) / ms.maxAbsX)
			v1 := int(255 * math.Abs(imag(z)) / ms.maxAbsY)
			v2 := int(255 * cmplx.Abs(z) / ms.maxAbsZ)
			v3 := int(255 * math.Abs(math.Atan2(imag(z), real(z))) / math.Pi)
			v := v3*int(math.Pow(float64(256), float64(3))) + v2*int(math.Pow(float64(256), float64(2))) + v1*256 + v0
			colorRGB := int(16777215 * v / int(math.Pow(float64(256), float64(4))))
			red := uint8(colorRGB / 65536)
			green := uint8((colorRGB / 256) % 256)
			blue := uint8(colorRGB % 256)
			img.Set(kx, ky, color.RGBA{R: red, G: green, B: blue, A: 255})
		}
	}
	if stopList.Read(ms.taskId) {
		ms.isFinished = true
		return errors.New("INTERRUPTED BY USER")
	}
	ms.progress = 100
	file, err := os.OpenFile(ms.Path(), os.O_WRONLY|os.O_CREATE, 0600)
	if err != nil {
		ms.isFinished = true
		return err
	}
	err = png.Encode(file, img)
	if err != nil {
		ms.isFinished = true
		return err
	}
	err = file.Close()
	if err != nil {
		ms.isFinished = true
		return err
	}
	ms.isFinished = true
	return nil
}

func (ms *MandelbrotSet) HandleProgress(handler func (int) error) error {
	return handler(ms.progress)
}

func (ms *MandelbrotSet) IsFinished() bool {
	return ms.isFinished
}

func (ms *MandelbrotSet) Path() string {
	return settings.MediaDirectory + ms.name + ".png"
}
