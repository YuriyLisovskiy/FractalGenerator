package computation_server

import (
	"fmt"
	"io"
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
	mux["/"] = params(index, "name")
	return mux
}

type CustomHandler struct{
	mux map[string]func(http.ResponseWriter, *http.Request)
}

func (ch *CustomHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if h, ok := ch.mux[r.URL.String()]; ok {
		h(w, r)
		return
	}
	_, err := io.WriteString(w, fmt.Sprintf("url %s is not found", r.URL.String()))
	if err != nil {
		panic(err)
	}
}


func params(fn func (writer http.ResponseWriter, request *http.Request), params ...string) func (writer http.ResponseWriter, request *http.Request) {
	return func (w http.ResponseWriter, r *http.Request) {
		q := r.URL.Query()
		for _, param := range params {
			if len(q.Get(param)) == 0 {
				http.Error(w, "missing " + param, http.StatusBadRequest)
				return
			}
		}

		// TODO: strip url

		fn(w, r)
	}
}

// Handlers
func index(writer http.ResponseWriter, request *http.Request) {
	_, err := io.WriteString(writer, "Index page!")
	fmt.Println(request.URL.Query())
	if err != nil {
		panic(err)
	}
}
