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

  await seed();

  const post = await db
    .selectFrom('posts')
    .where('posts.id', '=', postId)
    .leftJoin('users', 'users.id', 'posts.authorId')
    .select([
      'posts.id as postId',
      'posts.title',
      'posts.content',
      'posts.tags',
      'posts.createdAt as postCreatedAt',
      'users.id as userId',
      'users.name',
      'users.email',
      'users.image',
      'users.authType',
      'users.authId',
      'users.createdAt as userCreatedAt',
    ])
    .executeTakeFirst();

  if (!post) {
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  return res.status(200).json(post);
}
