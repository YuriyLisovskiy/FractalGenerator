from hashlib import sha512

from server.settings import SECRET_KEY


def secure_key_is_valid(key, host, port):
	return sha512(''.join([SECRET_KEY, host, port]).encode()).hexdigest() == key
