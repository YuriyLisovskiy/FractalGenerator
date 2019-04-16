from http.server import BaseHTTPRequestHandler

from handlers.db import Db
from server.server import ThreadedHttpServer
from handlers.computation_server.utils import forked


class ComputationServer:

	def __init__(self, host, port):
		self._host = host
		self._port = port
		self._http_server = ThreadedHttpServer((self._host, self._port), ComputationServerHandler)
		self._db = Db()

	def run(self):
		self._db.create_server(self._host, self._port)
		print('Started Computation Server at http://{}:{}'.format(self._host, self._port))
		self._serve()

	@forked
	def _serve(self):
		self._http_server.serve_forever()
		self._db.delete_server(self._host, self._port)


class ComputationServerHandler(BaseHTTPRequestHandler):

	def do_GET(self):
		print(self.path)

		message = "Hello!"

		self.protocol_version = "HTTP/1.1"
		self.send_response(200)
		self.send_header("Content-Length", len(message))
		self.end_headers()

		self.wfile.write(bytes(message, "utf8"))
