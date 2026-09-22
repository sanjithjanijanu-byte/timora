#!/usr/bin/env bash
set -o errexit

echo "==> Building frontend..."
cd frontend
npm install --legacy-peer-deps
npm run build
cd ..

echo "==> Installing backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt
