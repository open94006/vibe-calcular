import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsModule } from './products/products.module.js';
import { SeoModule } from './seo/seo.module.js';

@Module({
    imports: [
        // 支援環境變數
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        // 建立資料庫連線
        MongooseModule.forRoot(process.env.MONGODB_URI || 'mongodb://localhost:27017/vibe_calculator'),
        UsersModule,
        AuthModule,
        ProductsModule,
        SeoModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModule {}
