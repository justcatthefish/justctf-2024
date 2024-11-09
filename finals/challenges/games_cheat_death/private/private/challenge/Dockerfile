FROM openjdk:17-jdk-alpine

WORKDIR /app
COPY . /app
RUN wget https://piston-data.mojang.com/v1/objects/84194a2f286ef7c14ed7ce0090dba59902951553/server.jar

CMD ["java", "-Xmx1024M", "-Xms1024M", "-jar", "server.jar", "nogui"]