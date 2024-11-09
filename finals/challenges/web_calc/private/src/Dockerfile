FROM node:18-alpine

COPY ./ /app/

RUN apk update && apk upgrade
RUN apk add chromium

WORKDIR /app

RUN npm install express puppeteer

RUN adduser --disabled-password --gecos "" user
USER user
CMD ["node", "server.js"]