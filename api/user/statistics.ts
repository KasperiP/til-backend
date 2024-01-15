import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, seed } from '../../lib';
import { ApiError, type User } from '../../models';
import { calculateStreak } from '../../utils/calculateStreak';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    return res.status(403).json({ code: ApiError.MISSING_SESSION_COOKIE });
  }

  let decoded: User | null = null;
  try {
    decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET!) as User;
  } catch (err) {
    return res.status(403).json({ code: ApiError.INVALID_SESSION_COOKIE });
  }

  await seed();

  const userPromise = db
    .selectFrom('users')
    .leftJoin('posts', 'posts.authorId', 'users.id')
    .where('authId', '=', decoded.authId)
    .where('authType', '=', decoded.authType)
    .executeTakeFirst();

  const postsPromise = db
    .selectFrom('posts')
    .leftJoin('likes', 'likes.postId', 'posts.id')
    .where('authorId', '=', decoded.id)
    .select((eb) => [
      'posts.id as postId',
      'posts.title',
      'posts.description',
      'posts.tags',
      'posts.content',
      'posts.createdAt as postCreatedAt',
      eb.fn.count('likes.postId').as('likes'),
    ])
    .groupBy(['posts.id'])
    .orderBy('posts.id', 'desc')
    .execute();

  const totalPostsPromise = await db
    .selectFrom('posts')
    .select(['createdAt'])
    .execute();

  const [user, posts, totalPosts] = await Promise.all([
    userPromise,
    postsPromise,
    totalPostsPromise,
  ]);

  if (!user) {
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  const streak = calculateStreak(posts);

  const statistics = {
    userPosts: posts.length,
    userLikes: posts.reduce(
      (acc, post) => acc + parseInt(post.likes.toString(), 10),
      0,
    ),
    userStreak: streak,
    totalPosts: totalPosts.length,
    postsLastWeek: totalPosts.filter((post) => {
      const postCreatedAt = new Date(post.createdAt).getTime();
      const now = new Date().getTime();
      const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
      return postCreatedAt > weekAgo;
    }).length,
  };

  return res.status(200).json(statistics);
}
