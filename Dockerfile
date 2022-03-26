FROM node:17-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY ./src .
CMD ["node", "./server.js"]