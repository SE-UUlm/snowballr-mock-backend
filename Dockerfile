FROM node:23.6.0
WORKDIR /app
COPY . .
RUN npm install
RUN npm run compile:proto
RUN npm run build
CMD ["npm", "run", "start"]
