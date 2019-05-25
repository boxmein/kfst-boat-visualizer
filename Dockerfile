FROM raspbian/stretch
RUN apt-get update && apt-get -y install python3 python3-pip
# RUN pip3 install pipenv
ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8
EXPOSE 5000
ADD ./config.yml /srv/config.yml
#ADD ./Pipfile /srv/Pipfile
#ADD ./Pipfile.lock /srv/Pipfile.lock
ADD requirements.txt /srv/requirements.txt
ADD ./server/ /srv/server/
ADD frontend/build/ /srv/server/static/
ADD deployment/start-in-docker.sh /srv/start.sh
WORKDIR /srv/
# RUN pipenv install --ignore-pipfile
RUN pip3 install -r requirements.txt
CMD ["./start.sh"]
