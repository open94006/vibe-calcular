# Stage 1: Build Frontend (React + Vite)
FROM node:20 AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend (Express + TS)
FROM node:20 AS server-builder
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install
COPY server/ ./
RUN npm run build 

# Stage 3: Final Production Image
FROM node:20-slim
WORKDIR /app

# 複製後端依賴檔案並安裝 production 依賴
COPY server/package*.json ./
RUN npm install --production

# 複製後端編譯後的檔案 (dist)
COPY --from=server-builder /app/server/dist ./dist

# 複製前端編譯後的檔案到 dist/public
# 這樣後端 express.static(path.join(__dirname, 'public')) 才能找到
COPY --from=client-builder /app/client/dist ./dist/public

# 設定環境變數
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# 執行後端程式
CMD ["node", "dist/index.js"]