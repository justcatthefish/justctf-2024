FROM python:3.12-slim
WORKDIR /code
RUN apt-get update && apt-get install chromium-driver -y
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0
ENV DATABASE_URI=mysql+mysqlconnector://user:password@db/app
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
EXPOSE 5000
COPY . .
RUN adduser --disabled-password --gecos "" user
USER user
CMD ["flask", "run"]