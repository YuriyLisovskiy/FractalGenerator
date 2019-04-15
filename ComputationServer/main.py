from server.settings import HOST, PORT
from server.server import ThreadedHttpServer
from handlers.server_manager.handler import ServerManagerHandler as Handler


if __name__ == '__main__':
	with ThreadedHttpServer((HOST, PORT), Handler) as http_server:
		print('Started Server Manager at http://{}:{}'.format(HOST, PORT))
		http_server.serve_forever()
