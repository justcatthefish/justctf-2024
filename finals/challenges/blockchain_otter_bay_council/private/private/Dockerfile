FROM embe221ed/otter_template:latest@sha256:f0817dd5ccd7b610f87187dce6503c3aebd3369e6f4b7af5df969a8df63b696e

ADD ./sources/framework/chall /work/framework/chall
ADD ./sources/framework/src/main.rs /work/framework/src/

# build the challenge contracts
WORKDIR /work/framework/chall
RUN sui move build

WORKDIR /work/framework

# build the framework
RUN touch src/main.rs
RUN cargo build --locked --release

RUN echo "max_connections = 1000" >> /etc/postgresql/16/main/postgresql.conf

CMD [ "./run.sh" ]
