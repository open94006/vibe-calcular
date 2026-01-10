import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

@Injectable()
export class SeoService {
    private readonly __dirname = path.dirname(fileURLToPath(import.meta.url));

    get defaultSEO() {
        return {
            title: 'Vibe Calculator - Calculate your runner vibe',
            description: 'The ultimate calculator for runners to find their vibe.',
            keywords: 'running, calculator, vibe, performance',
        };
    }

    renderHTMLWithSEO(htmlPath: string): string {
        if (!fs.existsSync(htmlPath)) {
            return 'Index file not found';
        }

        let html = fs.readFileSync(htmlPath, 'utf8');
        const seo = this.defaultSEO;

        html = html.replace(/<title>.*?<\/title>/, `<title>${seo.title}</title>`);
        html = html.replace(/<meta name="description" content=".*?" \/>/, `<meta name="description" content="${seo.description}" />`);

        return html;
    }
}
