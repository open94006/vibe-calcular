# Route, controller & service

標籤: Node.js
建立時間: 2025年4月26日 下午6:03

在後端的第一個 API 可以看到

```tsx
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express + TS backend!' });
})
```

其中 `'/api/hello'` 是路徑，在前端可以透過 `fetch(http://localhost:5100/api/hello)` 敲擊 request 並得到一個格式為 json 的 message

那麼今天商品需要路徑，訂單與顧客也需要需要路徑，更不用說每個類別或情境都可能包含 CRUD 的 API，總不可能將每個路徑都包在同一個檔案。

這時候可以將使用的路徑與方法，拆解成 Route-Controller-Service 的結構（更可以說是職位）

說明分這三個職位的用意：

1. Route「身份驗證、並為其指路的門神」
    1. 統一整理路徑
    2. 負責基本的資料處理與身份驗證
    3. 將其導向到正確的 Controller
    4. 不會處理到商業邏輯與資料庫
2. Controller「運送任務、來來去去的運將」
    1. 接受 Route 的請求
    2. 清理資料格式
    3. 將當前請求的資料與欲完成的任務做相應處理
    4. 呼叫一個或多個 Service 來完成項目
    5. 發送回傳訊息
3. Service「多種能力、處理複雜事件的工匠」
    1. 實際被執行的業務與邏輯
    2. 確保資料的一致性
    3. 獨立完成事件，為資料存取服務，不受路徑與身份影響

以產品舉例，你應該會有的檔案結構是：

```css
src/
├── index.ts
├── routes/
│   └── product.route.ts
├── controllers/
│   └── product.controller.ts
└── services/
    └── product.service.ts
```

首先撰寫 product.route.ts

```tsx
// server/src/routes/product.route.ts

import express from 'express';

const router = express.Router();

router.get('/'); // 取得商品的路徑
router.post('/'); // 新增商品的路徑

export default router;
```

接著是 product.controller.ts

```tsx
// server/src/controllers/product.controller.ts

import { Request, Response } from 'express';

export const getProductController = (req: Request, res: Response, next: Function) => {
  // 「取得產品」的路由要處理過程
  try {
    const product = {}
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const postProductController = (req: Request, res: Response, next: Function) => {
  // 「新增產品」的路由要處理過程
  try {
    const product = {}
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

```

最後則是 product.service.ts

```tsx
// server/src/controllers/product.service.ts

export class ProductService {
  static getProdcut() {
    return {
      message: 'Get prodcut service!',
    };
  }

  static postProdcut(data: any) {
    console.log(data); // 預計顯示請求所帶的產品資料
    return {
      message: 'Post prodcut service!',
    };
  }
}

```

我們先建立完簡單的 service 回傳值，接下來就很簡單了，ProductService 這個類別可以單獨做「取得產品」與「新增產品」的工作，這樣既可以為 Route 與 Controller 省下繁重的程式工作，還能專責產品的資料處理

接下來在 Controller 引用 ProductService 的方法

```tsx
import { ProductService } from '../services/product.service';
```

並將兩個 ProductController 各自去拿該完成的 Service

```tsx
export const getProductController = (req: Request, res: Response, next: Function) => {
  try {
    const product = ProductService.getProdcut();
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};

export const postProductController = (req: Request, res: Response, next: Function) => {
  try {
	  // req.body.product 將會得到請求的 JSON data
    const product = ProductService.postProdcut(req.body.product);
    res.status(200).json(product);
  } catch (error) {
    next(error);
  }
};
```

讓 Route 去添加應該要走的 Controller

```tsx
import { getProductController, postProductController } from '../controllers/product.controller';

router.get('/', getProductController);
router.post('/', postProductController);
```

最後在 index.ts 使用這個 Route，就完成了

```tsx
import productRoute from './routes/product.route';

app.use('/api/product', productRoute);
```

> **（使用postman顯示請求結果）**
> 

這樣就完成基本的 Route-Controller-Service 架構了，如果單看程式碼，可能會覺得為什麼 Route-Controller 需要分開，不就只是要呼叫方法並執行嗎？

這裡可以設想一個簡單的狀況，舉例同樣都是「取得一件商品資訊」的邏輯

「商家」可以取得該商品所有資訊，並且有許多自訂內容，商家只想要自己知道或看到

而「消費者」端只是在瀏覽產品頁，系統只需回傳消費者所需知道的產品資訊

這時候可以設想兩種狀況：直接 if 判斷身份並回傳內容、與使用 Route-Controller 分工

使用 if 判斷的結果，會是「商家」與「消費者」都打同一條路，雖然都會 call getProdcut 這個方法，但前提是要先在裡頭做身份的判斷、資料的清理、最後再依是誰的身份回傳對應的格式，要是新增身份或改變規則時，很難維護

但如果是使用 Route-Controller ，可以在 Controller 上控制一個或多個身份上，理應要回傳的結果，為未來不同身份者去客製化處理。有機會出現「有會員的消費者」與「沒有註冊會員的訪客」走同一條，「外部使用 API 的串接人」走一條，「商家」走另一條等，最後讓 Route 去專門制定身份上的驗證，並導向到合理的 Controller

雖然都是「取得一件商品資訊」的邏輯，不過沒打理好分工和處理項目，未來可能會出現使用某一種情境與身份去請求，該方法卻有著兩千行以上程式碼的規模，想想就害怕