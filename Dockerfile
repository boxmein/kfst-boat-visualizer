FROM raspbian/stretch
RUN apt-get update && apt-get -y install python3 python3-pip && pip3 install pipenv
EXPOSE 5000
ADD ./config.yml /srv/config.yml
ADD ./Pipfile /srv/Pipfile
ADD ./Pipfile.lock /srv/Pipfile.lock
ADD ./server/ /srv/server/
ADD frontend/build/ /srv/server/static/
ADD deployment/start-in-docker.sh /srv/start.sh
WORKDIR /srv/
CMD ["./start.sh"]
