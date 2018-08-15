Interactive
Dockerfile

### Docker Options
```
docker run -d --name exphp -p 8080:80 --mount type=bind,source="$(pwd)"/www,target=/var/www/html -v "$(pwd)"/log:/var/log/apache2/ --restart=always example-php
```