package computation_server

import (
	"fmt"
	"io"
	"net/http"
)

func index(writer http.ResponseWriter, request *http.Request) {
	_, err := io.WriteString(writer, "Index page!")
	fmt.Println(request.URL.Query())
	if err != nil {
		panic(err)
	}
}
