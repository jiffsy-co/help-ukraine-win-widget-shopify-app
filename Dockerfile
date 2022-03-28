FROM node:14.17.3-alpine

ENV NODE_ENV production

WORKDIR /usr/src/app

COPY . /usr/src/app

RUN npm ci --only=production
RUN npm run build

EXPOSE 8081

USER node
CMD npm run start