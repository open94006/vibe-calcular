import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('products')
@Controller('api/product')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Get()
    @ApiOperation({ summary: 'Get all products' })
    async findAll() {
        return this.productsService.findAll();
    }

    @Post()
    @ApiOperation({ summary: 'Create a new product' })
    async create(@Body() productData: any) {
        return this.productsService.create(productData);
    }
}
