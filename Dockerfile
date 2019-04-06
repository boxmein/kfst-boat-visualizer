FROM debian
RUN apt-get -y install python3 python3-pip
RUN python3 -mpip install pipenv
ADD server /server
ADD frontend/dist/ /server/static/
ADD deployment/start.sh /server/start.sh
CMD ["/server/start.sh"]

