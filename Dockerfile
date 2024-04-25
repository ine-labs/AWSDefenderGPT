# Build react app
FROM --platform=linux/amd64 node:21-alpine as build-step

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH

ENV REACT_APP_HOST "/"

COPY web/package.json ./

RUN npm install

COPY web ./

RUN npm run build

# Serve flask and react app

FROM --platform=linux/amd64 python:3.8-slim

ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Install AWS CLI
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    curl \
    unzip \
    && curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" \
    && unzip awscliv2.zip \
    && ./aws/install \
    && rm -rf awscliv2.zip ./aws

WORKDIR /app
COPY --from=build-step /app/build ./build

COPY . .

RUN pip install --no-cache-dir -r requirements.txt

EXPOSE 5000

# Run the command to start the Flask app
CMD ["flask", "run", "--host=0.0.0.0"]