FROM pwntools/pwntools

WORKDIR /home/

COPY ./requirements.txt /home/requirements.txt
RUN pip install -Ur requirements.txt
COPY ./solve.py /home/solve.py

CMD python /home/solve.py
