import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

// Local app: robots.txt disallows everything; the sitemap only lists the home page to stay valid.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }];
}
