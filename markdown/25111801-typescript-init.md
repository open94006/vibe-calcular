# Typescript Init

標籤: Node.js
建立時間: 2025 年 4 月 19 日 下午 12:37

-   關鍵字
    brew, pnpm, vite, cors

## 1. 基本配置與安裝

```bash

// 建立並開啟新的資料夾（範例命名: ec）
mkdir ec && cd ec

// 安裝 Node.js
brew install node
node -v

// 安裝 typescript
brew install typescript
*tsc -v*

// 安裝 pnpm 套件管理工具
brew install pnpm
pnpm -v

// 初始化 package.json
pnpm init
```

## 2. 建立前端 react.js

```bash
// 使用 vite 建立 react.js
pnpm create vite@latest client --template react-ts

cd client
pnpm install
cd ..
```

## 3. 建立後端 express.js

```bash
// 建立 server 資料夾
mkdir server && cd server
pnpm init

// 安裝套件 tsx, express, cors
pnpm add -D tsx
pnpm add -D express @types/express
pnpm add -D cors @types/cors

// 初始化 tsconfig.json
tsc --init
```

編輯 server/tsconfig.json

```json
{
    "compilerOptions": {
        "module": "ESNext",
        "target": "ESNext",
        "outDir": "dist",
        "rootDir": "src",
        "strict": true,
        "esModuleInterop": true
    }
}
```

編輯 package.json 的 scripts

```tsx
"scripts": {
  "dev": "tsx watch src/index.ts",
  "build": "tsc",
  "start": "node dist/index.js"
}
```

## 5. 建立 server/src/index.ts

```tsx
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5100;

const corsOptions = {
    origin: 'http://localhost:8080',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.get('/api/hello', (req, res) => {
    res.json({ message: 'Hello from Express + TS backend!' });
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
```

## 6. 編輯 client/src/App.tsx

```tsx
import { useEffect, useState } from 'react';

function App() {
    const [message, setMessage] = useState('載入中');

    // 可以看到兩秒鐘後從「載入中」變化成後端回傳的文字
    useEffect(() => {
        setTimeout(() => {
            fetch('http://localhost:5100/api/hello')
                .then((res) => {
                    return res.json();
                })
                .then((data) => {
                    return setMessage(data.message);
                });
        }, 2000);
    }, []);

    return (
        <div>
            <h1>React + Express + TS</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;
```

最後更新根目錄 package.json 的 script

```tsx
"scripts": {
  "client": "pnpm --filter ./client dev",
  "server": "pnpm --filter ./server dev",
},
```

開啟兩個終端機執行

```bash
// 終端機 1
npm run client

// 終端機 2
npm run server
```
