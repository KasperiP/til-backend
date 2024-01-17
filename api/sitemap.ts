import { type VercelRequest, type VercelResponse } from '@vercel/node';
import {
  EnumChangefreq,
  SitemapStream,
  streamToPromise,
  type SitemapItemLoose,
} from 'sitemap';
import { db, seed } from '../lib';
import { ApiError } from '../models';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  await seed();

  const posts = await db
    .selectFrom('posts')
    .select(['id', 'title', 'createdAt'])
    .orderBy('createdAt', 'desc')
    .execute();

  const postPaths: SitemapItemLoose[] = posts.map((post) => ({
    url: `post/${post.id}`,
    lastmod: post.createdAt.toISOString(),
  }));

  const sitemapItems: SitemapItemLoose[] = [
    { url: '', priority: 1 },
    {
      url: 'feed',
      changefreq: EnumChangefreq.WEEKLY,
      lastmod: posts?.[0].createdAt.toISOString(),
    },
    { url: 'profile' },
    { url: 'new-post' },
    { url: 'legal/privacy-policy' },
    { url: 'legal/terms-of-service' },
  ];

  const sitemap: SitemapItemLoose[] = [...sitemapItems, ...postPaths];

  const smStream = new SitemapStream({
    hostname: 'https://learnedtoday.app',
  });

  sitemap.forEach((item) => {
    smStream.write(item);
  });

  smStream.end();

  const sitemapXml = (await streamToPromise(smStream)).toString();

  res.setHeader('Content-Type', 'application/xml');
  res.setHeader('CDN-Cache-Control', 'max-age=1800');
  return res.status(200).send(sitemapXml);
}
