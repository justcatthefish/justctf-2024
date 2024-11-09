FROM node:20-alpine

COPY ./ /app/

RUN apk update && apk upgrade
RUN apk add chromium

WORKDIR /app

RUN npm install

RUN adduser --disabled-password --gecos "" user
USER user
CMD ["node", "app.js"]
