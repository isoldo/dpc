FROM node:18 AS appbuild
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18
WORKDIR /usr/src/app
COPY package*.json ./
RUN npm install
COPY --from=appbuild usr/src/app/node_modules/.prisma/client ./node_modules/.prisma/client
COPY --from=appbuild usr/src/app/dist ./dist
COPY --from=appbuild usr/src/app/.env ./
EXPOSE 3000
EXPOSE 5432
CMD node dist/src/index.js
