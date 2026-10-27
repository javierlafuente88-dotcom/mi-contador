"""Servidor local que declara UTF-8. Solo para pasar ficheros al portapapeles.

El http.server de serie manda "text/plain" SIN charset, y el navegador lo
interpreta como latin-1: los acentos llegan rotos. Eso metio 'AtÃºn' en la
base de datos en vez de 'Atun' con tilde.

Uso: python -I tools/serve_utf8.py <carpeta> <puerto>
Escucha solo en 127.0.0.1.
"""
import functools
import http.server
import sys


class Utf8Handler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        base = super().guess_type(path)
        tipo = base[0] if isinstance(base, tuple) else base
        if tipo and tipo.startswith("text/"):
            return tipo + "; charset=utf-8"
        if str(path).endswith((".sql", ".txt", ".csv", ".json")):
            return "text/plain; charset=utf-8"
        return base

    def log_message(self, *args):
        pass


def main():
    carpeta = sys.argv[1] if len(sys.argv) > 1 else "."
    puerto = int(sys.argv[2]) if len(sys.argv) > 2 else 8099
    handler = functools.partial(Utf8Handler, directory=carpeta)
    with http.server.ThreadingHTTPServer(("127.0.0.1", puerto), handler) as srv:
        print(f"sirviendo {carpeta} en http://127.0.0.1:{puerto} con charset=utf-8")
        srv.serve_forever()


if __name__ == "__main__":
    main()
