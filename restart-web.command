#!/bin/bash
# Double-click this file in Finder to restart the web server (Mac).
cd "$(dirname "$0")"
lsof -tiTCP:3000 -sTCP:LISTEN | xargs kill -9 2>/dev/null
sleep 1
npm run web
