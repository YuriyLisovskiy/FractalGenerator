package util

import (
	"errors"
	"fmt"
	"sync"
)

type AsyncMap struct {
	map_ sync.Map
}

func NewAsyncMap() *AsyncMap {
	return &AsyncMap{
		map_: sync.Map{},
	}
}

func (m *AsyncMap) Write(key int64, val bool) {
	m.map_.Store(key, val)
}

func (m *AsyncMap) Read(key int64) bool {
	val, ok := m.map_.Load(key)
	if ok {
		return val.(bool)
	}
	return false
}

func (m *AsyncMap) ReadWitCheck(key int64) (bool, error) {
	val, ok := m.map_.Load(key)
	if ok {
		return val.(bool), nil
	}
	return false, errors.New(fmt.Sprintf("key '%d' doest not exist", key))
}
