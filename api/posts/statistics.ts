import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { db, seed } from '../../lib';
import { ApiError } from '../../models';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  await seed();

  const totalPosts = await db
    .selectFrom('posts')
    .select(['createdAt'])
    .execute();

  const statistics = {
    totalPosts: totalPosts.length,
    postsLastWeek: totalPosts.filter((post) => {
      const postCreatedAt = new Date(post.createdAt).getTime();
      const now = new Date().getTime();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      return postCreatedAt > weekAgo;
    }).length,
  };

  res.setHeader('CDN-Cache-Control', 'max-age=300');
  res.setHeader('Cache-Control', 'max-age=60');

  return res.status(200).json(statistics);
}
