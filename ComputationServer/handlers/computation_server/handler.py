from http.server import BaseHTTPRequestHandler

from server.server import ThreadedHttpServer


class ComputationServer:

	def __init__(self, host, port):
		self._host = host
		self._port = port
		self._TERMINATE = False
		self._http_server = ThreadedHttpServer((self._host, self._port), ComputationServerHandler)

	def clean_up(self):
		pass

	def run(self):
		print('Started Computation Server at http://{}:{}'.format(self._host, self._port))
		while not self._TERMINATE:
			self._http_server.serve_forever()


class ComputationServerHandler(BaseHTTPRequestHandler):

	def do_GET(self):
		print(self.path)

		message = "Hello!"

		self.protocol_version = "HTTP/1.1"
		self.send_response(200)
		self.send_header("Content-Length", len(message))
		self.end_headers()

		self.wfile.write(bytes(message, "utf8"))
