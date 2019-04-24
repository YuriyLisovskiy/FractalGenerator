package server

import (
	"encoding/json"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/jwt-go"
	"io"
	"net/http"
	"strings"
)

func Request(fn func(http.ResponseWriter, *http.Request, jwt.Claims), method string, params ...string) func(http.ResponseWriter, *http.Request) {
	return func(writer http.ResponseWriter, request *http.Request) {
		if strings.ToLower(request.Method) == strings.ToLower(method) {
			if strings.ToLower(request.Method) == "get" {
				q := request.URL.Query()
				var missingParams []string
				for _, param := range params {
					if len(q.Get(param)) == 0 {
						missingParams = append(missingParams, "\"" + param + "\"")
					}
				}
				if len(missingParams) > 0 {
					http.Error(writer, "Required parameters " + strings.Join(missingParams, ", "), http.StatusBadRequest)
				} else {
					if request.Header.Get("Content-Type") == "application/json" {
						decodeAndServe(fn, writer, request)
					} else {
						http.Error(writer, "Not Acceptable", http.StatusNotAcceptable)
					}
				}
			} else {
				decodeAndServe(fn, writer, request)
			}
		} else {
			http.Error(writer, "Not Allowed", http.StatusMethodNotAllowed)
		}
	}
}

type encodedRequest struct {
	Key string `json:"key"`
}

func decodeAndServe(fn func(http.ResponseWriter, *http.Request, jwt.Claims), writer http.ResponseWriter, request *http.Request) {
	decoder := json.NewDecoder(request.Body)
	var data encodedRequest
	err := decoder.Decode(&data)
	if err != nil {
		Error(writer, err.Error(), http.StatusBadRequest)
	} else {
		validator := jwt.HmacSha256(settings.SECRET)
		claims, err := validator.DecodeAndValidate(data.Key)
		if err != nil {
			Error(writer, "Forbidden", http.StatusForbidden)
		} else {
			fn(writer, request, *claims)
		}
	}
}

func Response(writer http.ResponseWriter, content string, statusCode int) error {
	writer.Header().Add("Content-Type", "application/json")
	_, err := io.WriteString(writer, content)
	return err
}

type errInfo struct {
	Detail string `json:"detail"`
}

func Error(writer http.ResponseWriter, detail string, statusCode int) {
	writer.Header().Add("Content-Type", "application/json")
	out, _ := json.Marshal(errInfo {Detail: detail})
	http.Error(writer, string(out), statusCode)
}
