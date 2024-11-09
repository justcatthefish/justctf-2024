FROM node:18-alpine
COPY ./ /app/
RUN apk update && apk upgrade
WORKDIR /app

RUN npm install express body-parser zod
RUN adduser --disabled-password --gecos "" user

USER user
CMD ["node", "server.js"]
