import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
    // Match only internationalized pathnames
    matcher: ['/', '/(ja|en|de|fr|es|ko|zh-CN|zh-TW|pt-BR|it|ru|vi|id|tr|nl|sv|no|da|fi)/:path*']
};
