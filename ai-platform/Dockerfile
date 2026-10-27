FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY package.json ./
COPY lib.mjs server.mjs ./
COPY public/ ./public/
USER node
EXPOSE 4181
CMD ["node", "server.mjs"]
