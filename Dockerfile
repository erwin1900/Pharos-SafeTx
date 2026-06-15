FROM node:24-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src
COPY adapters ./adapters
COPY examples ./examples
COPY schemas ./schemas
COPY skill.json ./
COPY README.md SKILL.md ./

USER node

CMD ["node", "adapters/http-server.js"]
