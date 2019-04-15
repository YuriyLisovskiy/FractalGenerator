from http.server import HTTPServer
from socketserver import ThreadingMixIn


class ThreadedHttpServer(ThreadingMixIn, HTTPServer):
    pass
