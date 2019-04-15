from multiprocessing import Process

from server.server import ThreadedHttpServer
from handlers.computation_server.handler import ComputationServerHandler


def start_server(host, port):
	with ThreadedHttpServer((host, port), ComputationServerHandler) as http_server:
		print('Started Computation Server at http://{}:{}'.format(host, port))
		process = Process(target=http_server.serve_forever)
		process.start()
		return process



