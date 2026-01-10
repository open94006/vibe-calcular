import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const port = process.env.PORT || 8080;

    // 根據架構師要求：API 響應格式統一化與錯誤處理
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
        })
    );

    // CORS 設定
    app.enableCors({
        origin: ['https://vibe-calculator-810458374554.asia-east1.run.app', 'http://localhost:5173', 'http://localhost:8080', 'http://z-running.com', 'https://z-running.com'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Swagger 文件設定
    const config = new DocumentBuilder().setTitle('Vibe Calculator API').setDescription('The Vibe Calculator API description').setVersion('1.0').addBearerAuth().build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    await app.listen(port, '0.0.0.0');
    console.log(`Application is running on: http://localhost:${port}`);
    console.log(`Swagger documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
