package main

import (
	"github.com/YuriyLisovskiy/LoadBalancer/load_balancer_server"
	"github.com/YuriyLisovskiy/LoadBalancer/server"
	"github.com/YuriyLisovskiy/LoadBalancer/settings"
	"os"
	"os/signal"
	"syscall"
)

func main() {
	c := load_balancer_server.New()
	err := c.Initialize()
	if err != nil {
		panic(err)
	}
	signalChannel := make(chan os.Signal, 1)
	signal.Notify(signalChannel, os.Interrupt, syscall.SIGTERM)
	go func() {
		sig := <-signalChannel
		switch sig {
		default:
			_ = c.DbClient.CleanServerQueues()
		}
	}()
	srv := server.NewServer(settings.HOST, settings.PORT, c.GetHandlers())
	err = srv.ListenAndServe()
	if err != nil {
		panic(err)
	}
}
