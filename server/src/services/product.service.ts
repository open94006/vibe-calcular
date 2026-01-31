export class ProductService {
    static getProduct() {
        return {
            message: 'Get product service!',
        };
    }

    static postProduct(data: any) {
        return {
            message: 'Post product service!',
        };
    }
}
