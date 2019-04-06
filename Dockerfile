FROM debian
RUN apt-get update && apt-get -y install python3 python3-pip && pip3 install pipenv
ADD server /server
ADD frontend/build/ /server/static/
ADD deployment/start-inside-docker.sh /server/start.sh
CMD ["/server/start.sh"]
