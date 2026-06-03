# -----------------------
# CONFIG
# -----------------------
FRONTEND_DIR=apps/frontend
SERVER_DIR=services/api
DOCKER_COMPOSE=docker compose
PYTHON?=.venv/Scripts/python.exe

# -----------------------
# HELP
# -----------------------
.PHONY: help install dev frontend backend backend-logs build deploy clean up down restart logs ps shell-api shell-worker test

help:
	@echo "Available commands:"
	@echo "  make install      - Install frontend + backend dependencies"
	@echo "  make dev          - Run frontend and backend concurrently (logs combined)"
	@echo "  make frontend     - Run frontend only (Vite)"
	@echo "  make backend      - Start backend services in background"
	@echo "  make backend-logs - Start backend services and tail logs"
	@echo "  make test         - Run backend + frontend tests"
	@echo "  make build        - Build frontend for production"
	@echo "  make deploy       - Build and deploy to GitHub Pages"
	@echo "  make clean        - Remove build artifacts, node_modules, and docker volumes"
	@echo "  make logs         - Tail logs for all docker services"
	@echo "  make ps           - List running containers"
	@echo "  make shell-api    - Open a shell in the API container"
	@echo "  make shell-worker - Open a shell in the Worker container"
	@echo "  make down         - Stop all docker services"

# -----------------------
# INSTALL
# -----------------------
install:
	cd $(FRONTEND_DIR) && npm install

# -----------------------
# DEVELOPMENT
# -----------------------
dev:
	$(DOCKER_COMPOSE) up -d --build
	cd $(FRONTEND_DIR) && npm start

frontend:
	cd $(FRONTEND_DIR) && npm start

backend:
	$(DOCKER_COMPOSE) up -d --build

backend-logs:
	$(DOCKER_COMPOSE) up --build

# -----------------------
# DOCKER CONTROL
# -----------------------
up:
	$(DOCKER_COMPOSE) up -d

down:
	$(DOCKER_COMPOSE) down

restart:
	$(DOCKER_COMPOSE) restart

logs:
	$(DOCKER_COMPOSE) logs -f

ps:
	$(DOCKER_COMPOSE) ps

shell-api:
	$(DOCKER_COMPOSE) exec api /bin/bash

shell-worker:
	$(DOCKER_COMPOSE) exec worker /bin/bash

# -----------------------
# TEST, BUILD & DEPLOY
# -----------------------
test:
	$(PYTHON) -m pytest $(SERVER_DIR)/test_server.py -q
	cd $(FRONTEND_DIR) && npm test

build:
	cd $(FRONTEND_DIR) && npm run build

deploy:
	cd $(FRONTEND_DIR) && npm run deploy

# -----------------------
# CLEAN
# -----------------------
clean:
	@echo "WARNING: This will remove all build artifacts, node_modules, and docker volumes."
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || [ "$$confirm" = "Y" ] || (echo "Aborted."; exit 1)
	$(DOCKER_COMPOSE) down -v
	rm -rf $(FRONTEND_DIR)/dist
	rm -rf $(FRONTEND_DIR)/node_modules
	rm -rf $(SERVER_DIR)/__pycache__
