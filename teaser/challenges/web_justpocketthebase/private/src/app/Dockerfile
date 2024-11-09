FROM node:18-alpine
RUN apk update && apk upgrade
RUN apk add chromium
RUN apk add --no-cache nginx
RUN apk add supervisor

WORKDIR /database
RUN wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.12/pocketbase_0.22.12_linux_amd64.zip && echo "$CACHEBUST"
RUN unzip pocketbase_0.22.12_linux_amd64.zip && echo "$CACHEBUST"
RUN rm pocketbase_0.22.12_linux_amd64.zip && echo "$CACHEBUST"
RUN rm CHANGELOG.md && echo "$CACHEBUST"
RUN rm LICENSE.md && echo "$CACHEBUST"

WORKDIR /app
COPY ./build/ /var/www/html/
COPY ./nginx.conf /etc/nginx/nginx.conf
COPY ./src-bot/ /app/
COPY ./supervisord.conf /etc/supervisor/supervisord.conf
COPY ./supervisord.conf /etc/supervisord.conf
RUN npm install
COPY --chown=root ./entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT /entrypoint.sh
