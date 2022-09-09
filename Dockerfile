FROM node:12-alpine
WORKDIR /app
COPY . .
RUN yarn install
CMD ["node","index.js"]
EXPOSE 3000