FROM node:20-slim as build
WORKDIR /app
COPY frontend/package*.json ./
RUN npm install --no-audit --legacy-peer-deps
COPY frontend ./
RUN npm run build
