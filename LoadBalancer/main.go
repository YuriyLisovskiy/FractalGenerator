package main

import (
	"github.com/YuriyLisovskiy/LoadBalancer/computation_server"
)

func main() {
	server := computation_server.NewComputationServer("localhost", 3000)
	err := server.ListenAndServe()
	if err != nil {
		panic(err)
	}
}
