import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, logger, seed } from '../../lib';
import { ApiError, LogType, type User } from '../../models';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  if (!req.body) {
    return res.status(400).json({ code: ApiError.MISSING_BODY });
  }

  const { postId } = req.body as { postId: number };

  if (!postId || isNaN(postId) || postId < 1) {
    logger('Invalid postId', LogType.ERROR, postId);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  const sessionCookie = req.cookies?.session;
  if (!sessionCookie) {
    logger('Missing session cookie', LogType.ERROR, req.cookies);
    return res.status(401).json({ code: ApiError.UNAUTHORIZED });
  }

  let decoded: User | null = null;
  try {
    decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET!) as User;
  } catch (err) {
    logger('Invalid session cookie', LogType.ERROR, err);
    return res.status(401).json({ code: ApiError.UNAUTHORIZED });
  }

  await seed();

  const post = await db
    .selectFrom('posts')
    .where('id', '=', postId)
    .select(['authorId'])
    .executeTakeFirst();

  if (!post) {
    logger('Post not found', LogType.ERROR, postId);
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  if (post.authorId === decoded.id) {
    return res.status(400).json({ code: ApiError.CANNOT_LIKE_OWN_POST });
  }

  const like = await db
    .selectFrom('likes')
    .where('userId', '=', decoded.id)
    .where('postId', '=', postId)
    .executeTakeFirst();

  if (like) {
    await db
      .deleteFrom('likes')
      .where('userId', '=', decoded.id)
      .where('postId', '=', postId)
      .execute();
  } else {
    await db
      .insertInto('likes')
      .values({ userId: decoded.id, postId })
      .execute();
  }

  return res.status(200).end();
}
