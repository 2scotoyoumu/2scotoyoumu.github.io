#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
2's Complement Web Sanctuary - Local Development Server Launcher

Usage:
    python serve.py              # Auto-detect best server (PHP preferred)
    python serve.py --port 8080  # Use custom port
    python serve.py --static     # Force Python built-in static server
    python serve.py --node       # Start Node.js backend (server.js)

Features:
    - Prefers PHP built-in server for full Apache-like functionality
      (counter.php, guestbook.php, bgm-list.php all work).
    - Falls back to Python http.server if PHP is not available.
    - Optional Node.js backend support.
    - Auto-opens the homepage in the default browser.
"""

import argparse
import http.server
import os
import shutil
import socketserver
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path


def find_executable(name: str) -> str | None:
    """Find an executable in PATH."""
    return shutil.which(name)


def detect_php() -> str | None:
    """Detect PHP executable, including common Windows paths."""
    php = find_executable("php")
    if php:
        return php
    # Common Windows PHP paths
    candidates = [
        r"C:\php\php.exe",
        r"C:\xampp\php\php.exe",
        r"C:\wamp64\bin\php\php.exe",
        r"C:\Program Files\php\php.exe",
        r"C:\Program Files (x86)\php\php.exe",
    ]
    for c in candidates:
        if os.path.isfile(c):
            return c
    return None


def detect_node() -> str | None:
    """Detect Node.js executable."""
    return find_executable("node")


def open_browser(url: str, delay: float = 1.0) -> None:
    """Open the given URL in the default browser after a short delay."""
    def _open() -> None:
        time.sleep(delay)
        try:
            webbrowser.open(url)
        except Exception as e:
            print(f"[WARN] Could not open browser: {e}")

    threading.Thread(target=_open, daemon=True).start()


def run_php_server(port: int) -> int:
    """Start the PHP built-in development server."""
    php = detect_php()
    if not php:
        print("[ERROR] PHP not found. Cannot start PHP server.")
        return 1

    # Verify PHP works
    try:
        result = subprocess.run(
            [php, "-v"], capture_output=True, text=True, timeout=5
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr.strip())
        version_line = result.stdout.splitlines()[0]
        print(f"[INFO] Detected: {version_line}")
    except Exception as e:
        print(f"[ERROR] PHP check failed: {e}")
        return 1

    url = f"http://127.0.0.1:{port}"
    print(f"[INFO] Starting PHP built-in server on {url}")
    print(f"[INFO] Home:      {url}/index.html")
    print(f"[INFO] Admin:     {url}/autouploader.html")
    print(f"[INFO] Reader:    {url}/markdown_reader.html")
    print(f"[INFO] Press Ctrl+C to stop.\n")

    open_browser(url + "/index.html")

    try:
        subprocess.run(
            [php, "-S", f"127.0.0.1:{port}", "-t", os.getcwd()],
            check=True,
        )
    except KeyboardInterrupt:
        print("\n[INFO] PHP server stopped.")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] PHP server exited with code {e.returncode}")
        return e.returncode
    return 0


def run_static_server(port: int) -> int:
    """Start Python's built-in static HTTP server."""
    directory = os.getcwd()
    url = f"http://127.0.0.1:{port}"

    print(f"[INFO] Starting Python static server on {url}")
    print(f"[INFO] Home:      {url}/index.html")
    print(f"[INFO] Note:      PHP features (counter/guestbook/bgm-list) will NOT work in static mode.")
    print(f"[INFO] Press Ctrl+C to stop.\n")

    open_browser(url + "/index.html")

    class QuietHandler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, directory=directory, **kwargs)

        def log_message(self, format, *args):
            # Suppress noisy request logs
            pass

    try:
        with socketserver.TCPServer(("127.0.0.1", port), QuietHandler) as httpd:
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n[INFO] Static server stopped.")
    except OSError as e:
        print(f"\n[ERROR] Could not bind to port {port}: {e}")
        return 1
    return 0


def run_node_server(port: int) -> int:
    """Start the Node.js backend (server.js)."""
    node = detect_node()
    if not node:
        print("[ERROR] Node.js not found. Cannot start Node backend.")
        return 1

    server_js = Path("server.js")
    if not server_js.is_file():
        print("[ERROR] server.js not found in current directory.")
        return 1

    url = f"http://127.0.0.1:{port}"
    print(f"[INFO] Starting Node.js backend on {url}")
    print(f"[INFO] Home:      {url}/index.html")
    print(f"[INFO] Admin:     {url}/autouploader.html")
    print(f"[INFO] Press Ctrl+C to stop.\n")

    open_browser(url + "/index.html")

    env = os.environ.copy()
    env["PORT"] = str(port)
    try:
        subprocess.run(
            [node, str(server_js)],
            env=env,
            check=True,
        )
    except KeyboardInterrupt:
        print("\n[INFO] Node server stopped.")
    except subprocess.CalledProcessError as e:
        print(f"\n[ERROR] Node server exited with code {e.returncode}")
        return e.returncode
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Launch the 2's Complement Web Sanctuary locally."
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8080,
        help="Port to listen on (default: 8080)",
    )
    parser.add_argument(
        "--static",
        action="store_true",
        help="Force Python static server (no PHP support)",
    )
    parser.add_argument(
        "--node",
        action="store_true",
        help="Start the Node.js backend (server.js)",
    )
    parser.add_argument(
        "--no-browser",
        action="store_true",
        help="Do not open the browser automatically",
    )
    args = parser.parse_args()

    # Override the open_browser function if requested
    if args.no_browser:
        global open_browser
        open_browser = lambda url, delay=1.0: None

    print("=" * 60)
    print("  2's Complement Web Sanctuary - Local Server Launcher")
    print("=" * 60 + "\n")

    if args.node:
        return run_node_server(args.port)

    if args.static:
        return run_static_server(args.port)

    # Auto mode: prefer PHP for full functionality
    php = detect_php()
    if php:
        return run_php_server(args.port)

    print("[WARN] PHP not found. Falling back to Python static server.")
    print("[WARN] PHP features (counter, guestbook, bgm-list) will be unavailable.\n")
    return run_static_server(args.port)


if __name__ == "__main__":
    sys.exit(main())
