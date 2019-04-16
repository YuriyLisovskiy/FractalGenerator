from multiprocessing import Process

from handlers.computation_server.handler import ComputationServer


def start_server(host, port):
	http_server = ComputationServer(host, port)
	process = Process(target=http_server.run)
	process.start()
	return process
