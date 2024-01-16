import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, seed } from '../../lib';
import { ApiError, type User } from '../../models';
import { estimateReadTime } from '../../utils/estimateReadTime';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  const { id } = req.query as { id: string | undefined };

  if (!id) {
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  const postId = parseInt(id, 10);

  if (isNaN(postId)) {
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (postId < 0) {
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  const sessionCookie = req.cookies?.session;
  let decoded: User | null = null;
  if (sessionCookie) {
    try {
      decoded = jwt.verify(sessionCookie, process.env.JWT_SECRET!) as User;
    } catch (err) {
      return res.status(401).json({ code: ApiError.UNAUTHORIZED });
    }
  }

  await seed();

  const post = await db
    .selectFrom('posts')
    .where('posts.id', '=', postId)
    .leftJoin('users', 'users.id', 'posts.authorId')
    .leftJoin('likes', 'likes.postId', 'posts.id')
    .select((eb) => [
      'posts.id as postId',
      'posts.title',
      'posts.description',
      'posts.content',
      'posts.tags',
      'posts.createdAt as postCreatedAt',
      'users.id as userId',
      'users.name',
      'users.image',
      eb.fn.count('likes.postId').as('likes'),
    ])
    .groupBy(['posts.id', 'users.id'])
    .executeTakeFirst();

  if (!post) {
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  let userHasLiked = false;
  if (decoded) {
    const like = await db
      .selectFrom('likes')
      .where('userId', '=', decoded.id)
      .where('postId', '=', postId)
      .selectAll()
      .executeTakeFirst();

    userHasLiked = !!like;
  }

  const postWithReadTime = {
    ...post,
    readTime: estimateReadTime(post.content),
    userHasLiked,
  };

  return res.status(200).json(postWithReadTime);
}
