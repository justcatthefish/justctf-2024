FROM perl:latest

WORKDIR /app

RUN cpan App::cpanminus && \
    cpanm --notest Dancer2 Twiggy Template

COPY . .

EXPOSE 3000

CMD ["perl", "app.pl"]
