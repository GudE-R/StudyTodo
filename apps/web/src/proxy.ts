import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // すべてのパスでミドルウェアを実行（ただし、API、静的ファイル、画像などは除く）
    matcher: ['/', '/privacy', '/(ja|en|de|fr|es|ko|zh-CN|zh-TW|pt-BR|it|ru|vi|id|tr|nl|sv|no|da|fi)/:path*']
};
