import { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

/**
 * sitemap.xml の動的生成
 * 全言語のページをサイトマップに含める
 */
export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://studytodo.app';
    const lastModified = new Date();

    // 各ロケールのメインページ、利用規約、プライバシーポリシーをサイトマップに追加
    const localePages = routing.locales.flatMap((locale) => [
        {
            url: `${baseUrl}/${locale}`,
            lastModified,
            changeFrequency: 'weekly' as const,
            priority: locale === routing.defaultLocale ? 1.0 : 0.9,
        },
        {
            url: `${baseUrl}/${locale}/terms`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        },
        {
            url: `${baseUrl}/${locale}/privacy`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.3,
        }
    ]);

    // ルートページ（リダイレクト先）
    const rootPage = {
        url: baseUrl,
        lastModified,
        changeFrequency: 'weekly' as const,
        priority: 1.0,
    };

    return [rootPage, ...localePages];
}
