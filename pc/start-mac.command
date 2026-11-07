#!/bin/sh
cd "$(dirname "$0")/.." || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo 'Please install the free Node.js LTS from https://nodejs.org then try again.'
  exit 1
fi
node pc/server.mjs
