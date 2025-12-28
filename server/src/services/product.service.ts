export class ProductService {
  static getProduct() {
    return {
      message: 'Get product service!',
    };
  }

  static postProduct(data: any) {
    console.log(data); // 預計顯示請求所帶的產品資料
    return {
      message: 'Post product service!',
    };
  }
}