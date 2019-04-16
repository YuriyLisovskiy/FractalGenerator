import os


def forked(fork_func, pid_handler=None):
	"""func pid_handler:
		@pid
		@is_started
	"""

	def fn(*args, **kwargs):
		pid = os.fork()
		if pid > 0:
			if pid_handler is not None:
				pid_handler(pid, True)
			fork_func(*args, **kwargs)
			exit(0)
		else:
			if pid_handler is not None:
				pid_handler(pid, False)
	return fn
