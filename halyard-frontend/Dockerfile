FROM nginx:1.17.10-alpine
RUN apk add nano && apk add curl

# Bundle up the front end.
COPY ./index.html.template /usr/share/nginx/html
COPY ./index.html /usr/share/nginx/html

# Configure nginx
COPY ./nginx.conf.template /etc/nginx/conf.d
COPY ./nginx-start.sh /usr/bin/nginx-start.sh
RUN chmod +x /usr/bin/nginx-start.sh
RUN rm -rf /etc/nginx/conf.d/default.conf
ENTRYPOINT ["/usr/bin/nginx-start.sh"]
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]