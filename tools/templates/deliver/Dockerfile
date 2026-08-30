# 只裝正式相依，映像檔才不會把開發用的東西一起帶上線
FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY . .
EXPOSE 8080
# 用非 root 跑。容器被打進去時，能做的事少一層
USER node
CMD ["node", "server.mjs"]
