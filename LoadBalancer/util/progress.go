package util

type Progress struct {
	maximums    []float32
	coefficient int
	startFrom   float32
}

func NewProgress(coefficient int, startFrom float32, maximums ...float32) Progress {
	return Progress{
		maximums:    maximums,
		coefficient: coefficient,
		startFrom:   startFrom,
	}
}

func (p *Progress) Calculate(args ...float32) int {
	progress := p.startFrom / float32(100)
	k := len(args)
	for i := 1; i <= k; i++ {
		denominator := float32(1.0)
		for j := 0; j < i; j++ {
			denominator *= p.maximums[j]
		}
		progress += args[i-1] / (float32(p.coefficient) * denominator)
	}
	return int(progress * 100)
}
