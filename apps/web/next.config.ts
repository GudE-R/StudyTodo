import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
// Trigger restart

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  transpilePackages: ['@studytodo/shared'],
};

export default withNextIntl(nextConfig);
