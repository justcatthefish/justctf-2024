FROM node:21.6.2-alpine

WORKDIR /app
COPY . /app/
RUN npm install
RUN adduser --disabled-password --gecos "" user
USER user
CMD ["node", "app.js"]