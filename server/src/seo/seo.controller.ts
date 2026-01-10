import { Controller, Get, Res, Req, Inject } from '@nestjs/common';
import { SeoService } from './seo.service.js';
import { Response, Request } from 'express';
import * as path from 'path';
import { fileURLToPath } from 'url';

@Controller()
export class SeoController {
    private readonly __dirname = path.dirname(fileURLToPath(import.meta.url));

    constructor(@Inject(SeoService) private readonly seoService: SeoService) {
        console.log('SeoController initialized, seoService injected:', !!this.seoService);
    }

    @Get('api/seo')
    getSeoData() {
        if (!this.seoService) {
            console.error('SeoService is undefined in getSeoData');
            return { error: 'SeoService not initialized' };
        }
        return this.seoService.defaultSEO;
    }

    @Get('*')
    handleAll(@Req() req: Request, @Res() res: Response) {
        // 排除 API 路由
        if (req.path.startsWith('/api')) {
            return;
        }

        // 排除靜態檔案 (如果有副檔名的話)
        if (req.path.includes('.')) {
            return res.sendFile(path.join(this.__dirname, '..', 'public', req.path));
        }

        const htmlPath = path.join(this.__dirname, '..', 'public', 'index.html');
        if (!this.seoService) {
            console.error('SeoService is undefined in handleAll');
            return res.sendFile(htmlPath); // Fallback to original file
        }
        const renderedHtml = this.seoService.renderHTMLWithSEO(htmlPath);
        res.send(renderedHtml);
    }
}
