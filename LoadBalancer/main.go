package main

import (
	"github.com/YuriyLisovskiy/LoadBalancer/manager_server"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
)

func main() {
	c := manager_server.New()
	err := c.Initialize()
	if err != nil {
		panic(err)
	}
	srv := server.NewServer(settings.HOST, settings.PORT, c.GetHandlers())
	err = srv.ListenAndServe()
	if err != nil {
		panic(err)
	}
}
