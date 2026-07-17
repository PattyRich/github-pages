FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM alpine:3.21

RUN apk add --no-cache coreutils

COPY --from=frontend-build /frontend/dist/ /opt/frontend/
COPY apps/frontend/install-release.sh /usr/local/bin/install-frontend-release

RUN chmod +x /usr/local/bin/install-frontend-release

ENTRYPOINT ["/usr/local/bin/install-frontend-release"]
