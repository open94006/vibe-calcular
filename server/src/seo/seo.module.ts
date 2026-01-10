import { Module } from '@nestjs/common';
import { SeoService } from './seo.service.js';
import { SeoController } from './seo.controller.js';

@Module({
    providers: [SeoService],
    controllers: [SeoController],
})
export class SeoModule {}
