import type { MetadataRoute } from 'next';

// Local app: nothing should be indexed.
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', disallow: '/' }] };
}
