FROM node:22-alpine AS frontend-build

WORKDIR /frontend

COPY apps/frontend/package.json apps/frontend/package-lock.json ./
RUN npm ci

COPY apps/frontend/ ./
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx/praynr.conf /etc/nginx/conf.d/default.conf
COPY nginx/cloudflare.conf /etc/nginx/cloudflare.conf
COPY --from=frontend-build /frontend/dist/ /usr/share/nginx/html/
