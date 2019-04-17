package server

import (
	"fmt"
	"net/http"
)

func NewServer(host string, port int, handlers *map[string]func(http.ResponseWriter, *http.Request)) http.Server {
	return http.Server{
		Addr: fmt.Sprintf("%s:%d", host, port),
		Handler: &CustomHandler{
			handlers: *handlers,
		},
	}
}

type CustomHandler struct {
	handlers  map[string]func(http.ResponseWriter, *http.Request)
}

func (ch *CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Method + " " + r.URL.String())

	if h, ok := ch.handlers[r.URL.Path]; ok {
		h(w, r)
	} else {
		http.Error(w, "Not found", http.StatusNotFound)
	}
}
