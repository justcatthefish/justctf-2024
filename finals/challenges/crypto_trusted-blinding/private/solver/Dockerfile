FROM python:3.9.20-bullseye

# permissions and nonroot user for tightened security
RUN adduser --home /home/app/ nonroot
RUN chown -R nonroot:nonroot /home/app
WORKDIR /home/app
USER nonroot

# venv
ENV VIRTUAL_ENV=/home/app/venv

# python setup
RUN python -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# install deps
COPY --chown=nonroot:nonroot requirements.txt solve.py cli.py ./
RUN pip install --upgrade pip
RUN pip install -r requirements.txt

COPY --chown=nonroot:nonroot python-pkcs1 ./python-pkcs1/
RUN cd python-pkcs1 && pip install .

CMD ["python", "./solve.py", "https://trusted-blinding.web.jctf.pro:443"]
