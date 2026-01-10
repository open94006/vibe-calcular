import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service.js';
import { ProductsController } from './products.controller.js';
import { Product, ProductSchema } from './product.schema.js';

@Module({
    imports: [MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }])],
    providers: [ProductsService],
    controllers: [ProductsController],
})
export class ProductsModule {}
