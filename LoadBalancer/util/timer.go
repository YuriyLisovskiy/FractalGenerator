package util

import (
	"log"
	"time"
)

type Timer struct {
	period      time.Duration
	finishAfter time.Duration
	start       time.Time
	current     time.Time
	end         time.Time
	interrupt   bool
}

func NewTimer(period time.Duration, finishAfter time.Duration) *Timer {
	newTimer := Timer{
		period:      period,
		finishAfter: finishAfter,
		start:       time.Now(),
		current:     time.Now(),
		end:         time.Now().Add(finishAfter),
		interrupt:   false,
	}
	newTimer.exec()
	return &newTimer
}

func (t *Timer) exec() {
	t.interrupt = false
	go func() {
		for {
			t.current = t.current.Add(t.period)
			time.Sleep(t.period)
			if t.Finished() || t.interrupt {
				return
			}
			log.Println("Time left: ", t.TimeLeft())
		}
	}()
}

func (t *Timer) Reset() {
	t.interrupt = true
	t.start = time.Now()
	t.current = time.Now()
	t.end = time.Now().Add(t.finishAfter)
	t.exec()
}

func (t *Timer) Finished() bool {
	return t.current.After(t.end)
}

func (t *Timer) TimeLeft() time.Duration {
	return t.end.Sub(t.current)
}
