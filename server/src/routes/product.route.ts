import express from 'express';
import { getProductController, postProductController } from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getProductController); // 取得商品的路徑
router.post('/', postProductController); // 新增商品的路徑

export default router;