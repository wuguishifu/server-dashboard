# build frontend
FROM node:18 AS build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# set up server
FROM node:18 AS server
WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ .
RUN npm run build
COPY --from=build /app/frontend/dist ./public

RUN apt-get update && apt-get install -y sqlite3
RUN mkdir /app/backend/data
RUN touch /app/backend/data/database.sqlite

CMD ["node", "dist/server.js"]
