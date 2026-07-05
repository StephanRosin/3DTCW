#!/usr/bin/env python3
"""Dev-Server ohne Caching — Browser sieht immer den aktuellen Stand.

Start:  python3 serve.py  [port]     (Default-Port: 8123)
"""
import sys
from http.server import HTTPServer, SimpleHTTPRequestHandler


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    print(f'TCW 3D auf http://localhost:{port} (ohne Cache)')
    HTTPServer(('', port), NoCacheHandler).serve_forever()
