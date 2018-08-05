FROM debian:jessie

LABEL MAINTAINER="worameth.semapat@gmail.com"

# Add the RethinkDB repository and public key
# "RethinkDB Packaging <packaging@rethinkdb.com>" http://download.rethinkdb.com/apt/pubkey.gpg
RUN apt-key adv --keyserver keys.gnupg.net --recv-keys 3B87619DF812A63A8C1005C30742918E5C8DA04A \
&& echo "deb http://download.rethinkdb.com/apt jessie main" > /etc/apt/sources.list.d/rethinkdb.list

ENV RETHINKDB_PACKAGE_VERSION 2.3.6~0jessie

RUN apt-get update \ 
    && apt-get install -y rethinkdb=$RETHINKDB_PACKAGE_VERSION \
    && rm -rf  /var/lib/apt/lists/*

# วิธีการเก็บรักษาของ docker technology เก็บไว้ที่ docker host ด้วย
# /var/lib/docker/volumn/repo/_data location
VOLUME [ "/data" ]

# Default Path
WORKDIR /data

# เหมือน CMD แต่ส่วนที่ดีกว่าคือ รับ parameter จาก CMD 
ENTRYPOINT [ "rethinkdb" ]
CMD [ "--bind", "all" ]

# ทุกเครื่องสามารถใช้งาน rethinkdb ได้ ไม่แนะนำ
# CMD [ "rethinkdb", "--bind", "all" ]

# บอกว่า service ของเราต้องใช้ port ไรบ้าง เพื่อให้เครื่องอื่นใช้ได้ ไม่งั้นจะเป็น private port
EXPOSE 28015 29015 8080

# -P คือให้ docker map port ให้เรา port อะไรก็ได้จาก EXPOSE
# docker run -d -P rethinkdb