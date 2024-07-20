FROM node:18

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# install sqlite3
RUN apt-get update && apt-get install -y sqlite3
RUN touch /app/database.sqlite

CMD ["node", "dist/server.js"]
