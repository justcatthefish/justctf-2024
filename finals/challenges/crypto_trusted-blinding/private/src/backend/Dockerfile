FROM node:22.5.1

RUN npm install pm2@latest -g

RUN adduser --home /home/app nonroot
RUN chown -R nonroot:nonroot /home/app
WORKDIR /home/app
USER nonroot

COPY --chown=nonroot:nonroot package.json tsconfig.json ./
RUN npm install

ENV NODE_ENV=production
COPY --chown=nonroot:nonroot index.ts ./
COPY --chown=nonroot:nonroot app ./app/
RUN npm run compile-prod

CMD ["npm", "run", "dev"]