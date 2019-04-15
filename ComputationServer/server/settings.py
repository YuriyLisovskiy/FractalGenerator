import os

SECRET_KEY = 'secret_key'


ROOT = os.path.dirname(os.path.dirname(os.path.realpath(__file__)))

HOST = 'localhost'
PORT = 8080

NEXT_PORT = PORT + 1

DB_USER = 'fractal_gen_user'
DB_PASSWORD = '2e7e55bac5442f79c047d13c546f9a29ec60457409873accffa1223cb7aa34d6'
DB_NAME = 'fractal_generator'
DB_HOST = 'localhost'
DB_PORT = 5432

CONNECTION_STRING = 'dbname=\'{}\' user=\'{}\' host=\'{}\' password=\'{}\''.format(
	DB_NAME, DB_USER, DB_HOST, DB_PASSWORD
)

SERVERS_LIMIT = 2

TASKS_LIMIT = 3
