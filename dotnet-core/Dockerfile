FROM ubuntu:16.04

LABEL MAINTAINER="worameth.semapat@gmail.com"

ENV ENVIRONMENT production

RUN apt-get update \
    && apt-get install -y wget \
    && apt-get install -y apt-transport-https \
    && wget -q https://packages.microsoft.com/config/ubuntu/16.04/packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y apt-transport-https \
    && apt-get install -y dotnet-sdk-2.1 \
    && rm -r /var/lib/apt/lists/*

COPY /testMvc /var/testMvc
WORKDIR /var/testMvc

CMD [ "dotnet", "run" ]

VOLUME [ "/var" ]

EXPOSE 5000 5001