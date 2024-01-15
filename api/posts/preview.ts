import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { db, logger, seed } from '../../lib';
import { ApiError, LogType } from '../../models';
import { estimateReadTime } from '../../utils/estimateReadTime';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'GET') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  const { limit, offset } = req.query as {
    limit: string | undefined;
    offset: string | undefined;
  };

  const formattedLimit = parseInt(limit ?? '10', 10) || 10;
  const formattedOffset = parseInt(offset ?? '0', 10) || 0;

  if (isNaN(formattedLimit) || isNaN(formattedOffset)) {
    logger('Limit or offset is not a number', LogType.ERROR, {
      limit,
      offset,
    });
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (formattedLimit > 100) {
    logger('Limit is too high', LogType.ERROR, formattedLimit);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (formattedOffset < 0) {
    logger('Offset is too low', LogType.ERROR, formattedOffset);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (formattedLimit < 0) {
    logger('Limit is too low', LogType.ERROR, formattedLimit);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  await seed();

  const posts = await db
    .selectFrom('posts')
    .leftJoin('users', 'users.id', 'posts.authorId')
    .leftJoin('likes', 'likes.postId', 'posts.id')
    .select((eb) => [
      'posts.id as postId',
      'posts.title',
      'posts.description',
      'posts.tags',
      'posts.content',
      'posts.createdAt as postCreatedAt',
      'users.id as userId',
      'users.name',
      'users.image',
      eb.fn.count('likes.postId').as('likes'),
    ])
    .groupBy(['posts.id', 'users.id'])
    .orderBy('posts.id', 'desc')
    .limit(formattedLimit + 1)
    .offset(formattedOffset)
    .execute();

  const hasMore = posts.length > formattedLimit;

  const formattedPosts = posts.map((post) => {
    return {
      ...post,
      content: undefined,
      likes: parseInt(post.likes as string, 10),
      readTime: estimateReadTime(post.content),
    };
  });

  res.setHeader('Cache-Control', 'public, s-maxage=120');

  return res.status(200).json({
    posts: formattedPosts.slice(0, formattedLimit),
    hasMore,
  });
}
