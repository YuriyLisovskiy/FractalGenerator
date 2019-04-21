package fractals

import (
	"fmt"
	"image"
	"image/color"
	"image/png"
	"math"
	"math/cmplx"
	"os"
)

type MandelbrotSet struct {
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

	progressChange float32
	progress       float32
	isFinished bool
}

func NewMandelbrotSet(x int, y int, maxIterations int) MandelbrotSet {
	return MandelbrotSet{
		xb: 1.0,
		yb: 1.5,
		ya: -1.5,
		xa: -2.0,
		imgX: x,
		imgY: y,
		maxAbsX: 0.0,
		maxAbsY: 0.0,
		maxAbsZ: 0.0,
		name: "MandelbrotSetFractal",
		maxIterations: maxIterations,
		progress: 0.0,
		isFinished: false,
		progressChange: 1.0 / float32(x) / float32(y) / float32(maxIterations),
	}
}

func (ms *MandelbrotSet) findMaxValues() {
	for ky := 0; ky < ms.imgY; ky++ {

		yProgress := float32(ky) / (2 * float32(ms.imgY))

		b := float64(ky)*(ms.yb-ms.ya)/float64(ms.imgY-1) + ms.ya
		for kx := 0; kx < ms.imgX; kx++ {

			xProgress := float32(kx) / (2 * float32(ms.imgX * ms.imgY))

			a := float64(kx)*(ms.xb-ms.xa)/float64(ms.imgX-1) + ms.xa
			c := complex(a, b)
			z := complex(a, b)
			for i := 0; i < ms.maxIterations; i++ {
				z = z*z + c
				if cmplx.Abs(z) > 2.0 {
					break
				}

				zProgress := float32(i) / (2 * float32(ms.imgX * ms.imgY * ms.maxIterations))
				ms.progress = xProgress + yProgress + zProgress
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
}

func (ms *MandelbrotSet) Generate() error {
	img := image.NewRGBA(image.Rect(0, 0, ms.imgX, ms.imgY))
	ms.findMaxValues()

	halfProgress := ms.progress

	for ky := 0; ky < ms.imgY; ky++ {

		yProgress := float32(ky) / (2 * float32(ms.imgY))

		b := float64(ky)*(ms.yb-ms.ya)/float64(ms.imgY-1) + ms.ya
		for kx := 0; kx < ms.imgX; kx++ {

			xProgress := float32(kx) / (2 * float32(ms.imgX * ms.imgY))

			a := float64(kx)*(ms.xb-ms.xa)/float64(ms.imgX-1) + ms.xa
			c := complex(a, b)
			z := complex(a, b)
			for i := 0; i < ms.maxIterations; i++ {
				z = z*z + c
				if cmplx.Abs(z) > 2.0 {
					break
				}

				zProgress := float32(i) / (2 * float32(ms.imgX * ms.imgY * ms.maxIterations))
				ms.progress = xProgress + yProgress + zProgress + halfProgress
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
	ms.progress = 100
	file, err := os.OpenFile("./"+ms.name+".png", os.O_WRONLY|os.O_CREATE, 0600)
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

	fmt.Println(fmt.Sprintf("Progress: %f", ms.progress))

	return handler(int(ms.progress * 100))
}

func (ms *MandelbrotSet) IsFinished() bool {
	return ms.isFinished
}
