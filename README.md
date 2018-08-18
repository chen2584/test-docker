Interactive
Dockerfile

### Docker Options
```
docker run -d --name exphp -p 8080:80 --mount type=bind,source="$(pwd)"/www,target=/var/www/html -v "$(pwd)"/log:/var/log/apache2/ --restart=always example-php
```

### Docker Volume
```
docker volume create --driver local --opt type=nfs --opt device=$(pwd)/docroot --opt o=bind,rw webroot
```

### Docket Network
none, host, bridge, overlay
```
docker network create --driver=bridge --subnet=192.168.100.0/24 --gateway=192.168.100.254 my-network
docker run -d --name test-my --network=my-network example-php
```