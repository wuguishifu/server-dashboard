FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# install sqlite3
RUN apt-get update && apt-get install -y sqlite3

# create database
RUN mkdir /app/data
RUN touch /app/data/database.sqlite

CMD ["node", "dist/server.js"]
