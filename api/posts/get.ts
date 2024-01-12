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

  const posts = await db.selectFrom('posts').selectAll().execute();

  return res.status(200).json(posts);
}
