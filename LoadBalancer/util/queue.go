package util

import (
	"container/list"
)

type Queue struct {
	ls *list.List
}

func NewQueue() Queue {
	return Queue{ls: list.New()}
}

func (q *Queue) Push(item interface{}) {
	q.ls.PushBack(item)
}

func (q *Queue) Pop() interface{} {
	if !q.IsEmpty() {
		item := q.ls.Front()
		q.ls.Remove(item)
		return item.Value
	}

	return nil
}

func (q *Queue) Contains(item interface{}) bool {
	for el := q.ls.Front(); el != nil; el = el.Next(){
		if el.Value == item {
			return true
		}
	}
	return false
}

func (q *Queue) IsEmpty() bool {
	return q.ls.Len() == 0
}
