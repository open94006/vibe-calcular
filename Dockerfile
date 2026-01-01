# 階段一：編譯前端 React
FROM node:20 AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# 階段二：編譯後端 TypeScript
FROM node:20 AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build 

# 階段三：最終執行環境
FROM node:20-slim
WORKDIR /app

# 複製後端 package.json 並安裝 production 依賴
COPY server/package*.json ./
RUN npm install --production

# 複製後端編譯好的 JS 檔案 (從 server/dist 複製到 /app/dist)
COPY --from=server-builder /app/server/dist ./dist

# 複製前端編譯好的檔案到後端預期的 public 目錄
# 根據 server/src/index.ts，它會尋找 __dirname/public
# 由於執行的是 dist/index.js，所以 public 應該放在 dist/public
COPY --from=client-builder /app/client/dist ./dist/public

ENV NODE_ENV=production
# Cloud Run 會提供 PORT 環境變數，程式內已處理預設 8080
EXPOSE 8080

# 執行編譯後的 JS
CMD ["node", "dist/index.js"]
