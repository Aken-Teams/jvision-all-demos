# Next.js 專案：先安裝、再建置，最後用非 root 跑。
#
# 沒有用 next 的 standalone 輸出。standalone 會自己判斷「哪些檔案有被用到」
# 再挑出來，映像檔小很多，但漏掉一個就是客戶第一次啟動才炸開——
# 而那時候我們看不到現場。這裡選最單純、最不會意外的做法。
FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .
RUN npm run build && chown -R node:node /app

ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 用非 root 跑。容器被打進去時，能做的事少一層
USER node

# 先建表再啟動。建表要在服務起來之前跑完，不然第一個打進來的請求
# 會等在那裡建表，客戶會看到轉圈圈很久又不知道發生什麼事。
CMD ["sh", "-c", "node scripts/init-db.mjs && npm start"]
