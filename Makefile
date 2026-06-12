# -----------------------
# CONFIG
# -----------------------
FRONTEND_DIR=apps/frontend
SERVER_DIR=services/api
DOCKER_COMPOSE=docker compose
PYTHON?=.venv/Scripts/python.exe
PYTHON_WIN?=.venv\Scripts\python.exe

# -----------------------
# HELP
# -----------------------
.PHONY: help install install-hooks dev frontend backend backend-logs build deploy clean up down restart logs ps shell-api shell-worker test typecheck frontend-verify format format-check e2e e2e-headed

help:
	@echo "Available commands:"
	@echo "  make install      - Install frontend + backend dependencies"
	@echo "  make install-hooks - Configure Git hooks for this checkout"
	@echo "  make dev          - Run frontend and backend concurrently (logs combined)"
	@echo "  make frontend     - Run frontend only (Vite)"
	@echo "  make backend      - Start backend services in background"
	@echo "  make backend-logs - Start backend services and tail logs"
	@echo "  make test         - Run backend tests, frontend typecheck/tests, and E2E"
	@echo "  make typecheck    - Run frontend TypeScript typecheck"
	@echo "  make frontend-verify - Run frontend typecheck, lint, format check, and unit tests"
	@echo "  make format       - Format frontend files with Prettier"
	@echo "  make format-check - Check frontend formatting with Prettier"
	@echo "  make build        - Build frontend for production"
	@echo "  make deploy       - Build and deploy to GitHub Pages"
	@echo "  make clean        - Remove build artifacts, node_modules, and docker volumes"
	@echo "  make logs         - Tail logs for all docker services"
	@echo "  make ps           - List running containers"
	@echo "  make shell-api    - Open a shell in the API container"
	@echo "  make shell-worker - Open a shell in the Worker container"
	@echo "  make down         - Stop all docker services"
	@echo "  make e2e          - Run Playwright browser E2E tests"
	@echo "  make e2e-headed   - Run Playwright browser E2E tests with the browser visible"

# -----------------------
# INSTALL
# -----------------------
install:
	cd $(FRONTEND_DIR) && npm install

install-hooks:
	git config core.hooksPath .githooks
	@echo "Git hooks enabled from .githooks"

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
	cd $(FRONTEND_DIR) && npm run typecheck
	cd $(FRONTEND_DIR) && npm test
	$(PYTHON) tests/e2e/run_e2e.py

typecheck:
	cd $(FRONTEND_DIR) && npm run typecheck

frontend-verify:
	cd $(FRONTEND_DIR) && npm run verify

format:
	cd $(FRONTEND_DIR) && npm run format

format-check:
	cd $(FRONTEND_DIR) && npm run format:check

e2e:
	$(PYTHON) tests/e2e/run_e2e.py

e2e-headed:
	$(PYTHON) tests/e2e/run_e2e.py --headed

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
