package settings

import (
	"os"
)

const (
	SECRET = "secret_key"

	HOST = "localhost"
	PORT = 8080

	DB_HOST = "localhost"
	DB_PORT = 5432
	DB_USER = "fractal_gen_user"
	DB_PASSWORD = "2e7e55bac5442f79c047d13c546f9a29ec60457409873accffa1223cb7aa34d6"
	DB_NAME = "fractal_generator"

	MAX_SUB_SERVERS = 2
	MAX_TASKS_PER_SERVER = 2

	SITE_HOST = "http://localhost:3000/api/remote/server/load/picture"
)

var MediaDirectory = mediaDir()

func mediaDir() string {
	root, _ := os.Getwd()
	path := root + "/media/"
	if _, err := os.Stat(path); os.IsNotExist(err) {
		_ = os.Mkdir(path, 0777)
	}
	return path
}
