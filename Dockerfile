FROM node:alpine

WORKDIR /home/node/app

COPY package.json ./
COPY package-lock.json ./
RUN npm install --production
COPY src src/

EXPOSE 3000

CMD [ "npm", "start" ]
