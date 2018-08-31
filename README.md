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

### Docker Network
none, host, bridge, overlay
```
docker network create --driver=bridge --subnet=192.168.100.0/24 --gateway=192.168.100.254 my-network
docker run -d --name test-my --network=my-network example-php
```


### Docker Swarm
```
docker swarm init --adverise-addr 192.168.0.5
docker network create -d overlay my-network
docker swarm join --token afserhaShjmg,trerzsghjm,guytrzesg≈f 10.211.55.4:2377
```

### Docker Services Mode
1. Global กระจายไปทุก node รวมถึงตัวมันเอง
2. Replicated กำหนด node ที่ต้องการ
```
docker service create --name myweb --replicas 2 --network my-network --mount type=bind,source=/Users/chen/myweb,destination=/var/www/html -p 80:80 php:7-apache
docker service ls
docker service ps myweb
docker service scale myweb=10
docker service update myweb
<<<<<<< HEAD
=======
```

### Docker Swarm Compose
```
docker stack deploy -c docker-compose.yml myweb
docker stack services myweb
docker stack services myweb
docker stack ps myweb
>>>>>>> 02d01c1522019d66a28c2f7de5e52951e80b78e7
```