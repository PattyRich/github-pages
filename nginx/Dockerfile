FROM nginx:1.27-alpine

COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/reload-if-needed.sh /usr/local/bin/reload-nginx-if-needed

RUN chmod +x /usr/local/bin/reload-nginx-if-needed
