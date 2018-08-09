FROM debian:jessie
# by me

ENV text "Hello World I'm ENV"

RUN echo ${text}
# execute when building image

ENTRYPOINT [ "echo" ]
CMD [ "hello I'm CMD" ]
# execute when run image as container

# docker build -t hello:world .
# . is current location