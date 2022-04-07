FROM node:17-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ./src ./src
COPY ./greenlock.d ./greenlock.d
RUN npm run doc
CMD ["node", "./src/server.js"]