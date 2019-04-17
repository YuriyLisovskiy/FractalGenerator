package computation_server

import (
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/util"
	"net/http"
)

func NewComputationServer(host string, port int) http.Server {
	return http.Server{
		Addr:    fmt.Sprintf("%s:%d", host, port),
		Handler: &CustomHandler{
			mux: initHandlers(),
		},
	}
}

func initHandlers() map[string]func(http.ResponseWriter, *http.Request) {
	mux := make(map[string]func(http.ResponseWriter, *http.Request))
	mux["/task/create"] = util.AuthRequest(index, "GET", "title", "owner", "task_type")
	return mux
}

type CustomHandler struct {
	mux map[string]func(http.ResponseWriter, *http.Request)
}

func (ch *CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	fmt.Println(r.Method + " " + r.URL.String())

	if h, ok := ch.mux[r.URL.Path]; ok {
		h(w, r)
	} else {
		http.Error(w, "Not found", http.StatusNotFound)
	}
}
