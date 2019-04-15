import psycopg2

from server.settings import CONNECTION_STRING


class Db:

	__instance = None

	def __init__(self):
		if self.__instance is None:
			print('Connected to PostgreSQL database')
			self.__instance = psycopg2.connect(CONNECTION_STRING)

	def _exec_query(self, query, data=None):
		cursor = self.__instance.cursor()
		cursor.execute(query, data)
		cursor.close()

	def _get_one(self, query, values=None):
		cursor = self.__instance.cursor()
		cursor.execute(query, values)
		res = cursor.fetchone()
		cursor.close()
		return res

	def create_server(self, host, port):
		self._exec_query('SELECT CreateServerQueue(%s, %d);', (host, port))

	def delete_server(self, host, port):
		self._exec_query('SELECT DeleteServerQueue(%s, %d);', (host, port))

	def get_available_server(self):
		res = self._get_one('SELECT * FROM GetAvailableServer;')
		return {
			'id': res[0],
			'host': res[1],
			'port': res[2],
			'tasks_count': res[3],
			'servers_count': res[4]
		}

	def get_tasks(self, server_id, limit):
		pass

	def update_task(self, task_id, status, progress):
		pass

	def delete_task(self, task_id):
		pass
