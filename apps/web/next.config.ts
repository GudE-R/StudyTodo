import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from "next";
// Trigger restart

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  /* config options here */
};

export default withNextIntl(nextConfig);
