# Use an official Nginx image with the njs module included
FROM nginx:latest

ARG FLAG

# Copy the nJS script into the container
COPY validate.js /etc/nginx/njs/validate.js

# Remove the default configuration file
COPY nginx.conf /etc/nginx/nginx.conf

RUN sed -i "s/FLAG_PLACEHOLDER/${FLAG}/" /etc/nginx/nginx.conf

# Expose port 80 for HTTP traffic
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
