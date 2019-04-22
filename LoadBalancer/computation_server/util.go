package computation_server

import (
	"bytes"
	"errors"
	"fmt"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"github.com/YuriyLisovskiy/LoadBalancer/util/models"
	"github.com/YuriyLisovskiy/jwt-go"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

func fileUploadRequest(uri string, params map[string]interface{}, paramName, path string) (*http.Request, error) {
	file, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	body := &bytes.Buffer{}
	writer := multipart.NewWriter(body)
	part, err := writer.CreateFormFile(paramName, filepath.Base(path))
	if err != nil {
		return nil, err
	}
	_, err = io.Copy(part, file)
	if err != nil {
		return nil, err
	}

	err = writer.Close()
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", uri, body)
	req.Header.Set("Content-Type", writer.FormDataContentType())

	encoder := jwt.HmacSha256(settings.SECRET)
	claims := jwt.NewClaims()
	for key, val := range params {
		claims.Set(key, val)
	}
	claims.Set("exp", time.Now().Add(time.Minute * 5).Unix())
	token, err := encoder.Encode(claims)
	req.Header.Set("auth_token", token)
	return req, err
}

func sendFractal(task models.TaskItem) error {
	request, err := fileUploadRequest(
		settings.SITE_HOST,
		map[string]interface{} {
			"title": task.Title,
			"width": task.Width,
			"height":task.Height,
			"owner": task.OwnerId,
			"task_id": task.Id,
		},
		"fractal_image",
		task.Generator.Path(),
	)
	if err != nil {
		return err
	}

	client := &http.Client{}

	fmt.Println(request.Method)

	resp, err := client.Do(request)
	if err != nil {
		return err
	} else {
		body := &bytes.Buffer{}
		_, err := body.ReadFrom(resp.Body)
		if err != nil {
			return err
		}
		err = resp.Body.Close()
		if err != nil {
			return err
		}
		if resp.StatusCode != 200 {
			return errors.New(fmt.Sprintf("status %d", resp.StatusCode))
		}
	}
	return nil
}
