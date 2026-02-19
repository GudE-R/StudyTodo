import { MetadataRoute } from 'next';

/**
 * robots.txt の動的生成
 * 検索エンジンのクロール指示を提供
 */
export default function robots(): MetadataRoute.Robots {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studytodo.app';

    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/api/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
