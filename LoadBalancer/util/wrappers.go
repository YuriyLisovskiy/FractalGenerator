package util

import (
	"github.com/YuriyLisovskiy/jwt"
	"net/http"
	"strings"
)

func Request(fn func (writer http.ResponseWriter, request *http.Request), method string, params ...string) func (writer http.ResponseWriter, request *http.Request) {
	return func (w http.ResponseWriter, r *http.Request) {
		if strings.ToLower(r.Method) == strings.ToLower(method) {
			q := r.URL.Query()
			var missingParams []string
			for _, param := range params {
				if len(q.Get(param)) == 0 {
					missingParams = append(missingParams, "\"" + param + "\"")
				}
			}
			if len(missingParams) > 0 {
				http.Error(w, "Required parameters " + strings.Join(missingParams, ", "), http.StatusBadRequest)
			}
			if r.Header.Get("Content-Type") == "application/json" {
				fn(w, r)
			} else {
				http.Error(w, "Not Acceptable", http.StatusNotAcceptable)
			}
		} else {
			http.Error(w, "Not Allowed", http.StatusMethodNotAllowed)
		}
	}
}

func AuthRequest(fn func (writer http.ResponseWriter, request *http.Request), method string, params ...string) func (writer http.ResponseWriter, request *http.Request) {
	return Request(
		func (w http.ResponseWriter, r *http.Request) {
			token := r.Header.Get("Security-Key")
			jwtValidator := jwt.HmacSha256()
			jwtValidator.Validate(token)
			fn(w, r)
		},
	method, params...)
}