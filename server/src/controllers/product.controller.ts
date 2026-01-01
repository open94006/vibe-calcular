import { Request, Response } from 'express';
import { ProductService } from '../services/product.service.js';

export const getProductController = (req: Request, res: Response, next: Function) => {
    // 「取得產品」的路由要處理過程
    try {
        const product = ProductService.getProduct();
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};

export const postProductController = (req: Request, res: Response, next: Function) => {
    // 「新增產品」的路由要處理過程
    try {
        // req.body.product 將會得到請求的 JSON data
        const product = ProductService.postProduct(req.body.product);
        res.status(200).json(product);
    } catch (error) {
        next(error);
    }
};
