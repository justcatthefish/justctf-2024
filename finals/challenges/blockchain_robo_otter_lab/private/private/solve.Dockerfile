FROM embe221ed/otter_template:latest@sha256:f0817dd5ccd7b610f87187dce6503c3aebd3369e6f4b7af5df969a8df63b696e

ADD ./sources/run_client.sh /work/
ADD ./sources/framework-solve /work/framework-solve

WORKDIR /work/

CMD [ "./run_client.sh" ]
