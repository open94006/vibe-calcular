# ... (前兩個階段不變)

# 階段三：最終執行環境
FROM node:20-slim
WORKDIR /app

# 複製 package.json
COPY server/package*.json ./
RUN npm install --production

# 複製後端編譯後的檔案
COPY --from=server-builder /app/server/dist ./dist

# 複製前端檔案 (確保它在 dist 裡面)
COPY --from=client-builder /app/client/dist ./dist/public

# 設定環境變數
ENV NODE_ENV=production
# 這裡不需要 EXPOSE 8080，Cloud Run 會處理，但寫著也沒關係

# 增加一個啟動檢查 (Debug 用)
RUN ls -R /app/dist 

# 直接執行，並確保路徑對應到你編譯後的進入點
# 如果你的 index.ts 在 src 下，編譯後可能是 dist/src/index.js
CMD ["node", "dist/index.js"]