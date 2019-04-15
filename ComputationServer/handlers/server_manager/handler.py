import json
from http.server import BaseHTTPRequestHandler

from server import settings
from handlers.server_manager.utils import start_server
from handlers.util import secure_key_is_valid

from handlers.db import Db

db = Db()


class ServerManagerHandler(BaseHTTPRequestHandler):

	def do_GET(self):
		try:
			if 'Content-Type' not in self.headers or 'application/json' not in self.headers['Content-Type'].lower():
				self._send(400, '"application/json" content-type is required')
			if 'Security-Key' not in self.headers:
				self._send(403, 'security key is required')
			if secure_key_is_valid(self.headers['Security-Key'], settings.HOST, str(settings.PORT)):
				if self.path == '/get/server':
					self.get_server()
				else:
					self._send(404, 'not found')
			else:
				self._send(403, 'invalid security key')
		except Exception as exc:
			self._send(500, '{}'.format(exc))

	def _send(self, status, content=None):
		self.protocol_version = 'HTTP/1.1'
		self.send_response(status)
		if content is not None:
			self.send_header('Content-Length', len(content))
		self.end_headers()
		if content is not None:
			self.wfile.write(bytes(content, 'utf8'))

	# returns available server's information
	def get_server(self):
		available_server = db.get_available_server()
		server_info = {}
		if available_server is not None and available_server['servers_count'] >= settings.SERVERS_LIMIT:
			server_info['host'] = available_server['host']
			server_info['port'] = available_server['port']
		else:
			start_server(settings.HOST, settings.NEXT_PORT)
			server_info['host'] = settings.HOST
			server_info['port'] = settings.PORT
			settings.NEXT_PORT += 1
		self._send(200, json.dumps(server_info))
