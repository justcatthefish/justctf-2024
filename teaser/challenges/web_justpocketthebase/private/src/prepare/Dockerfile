FROM ubuntu
ARG ADMIN_PASSWORD
ARG FLAG

RUN apt-get update
RUN apt-get install -y nodejs npm exiftool

WORKDIR /app

COPY src/ /app/

RUN exiftool -artist="$FLAG" ./plants/polant.png
RUN npm install

CMD node prepare.js $ADMIN_PASSWORD
