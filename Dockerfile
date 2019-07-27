FROM node:11-stretch

EXPOSE 3030

RUN mkdir /src
WORKDIR /src
RUN apt update
#RUN rm -rf /tmp/* /var/cache/apt/*

# Copy files
ADD . /src

# Install app dependencies
RUN npm -g install napa grunt

#RUN npm install 

#RUN npm run postinstall

#COPY entrypoint.sh /entrypoint.sh
#RUN chmod +x /entrypoint.sh
#ENTRYPOINT ["/entrypoint.sh"]

# Run node server
#CMD ["node", "web.js"]
