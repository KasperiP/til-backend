import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, seed } from '../../lib';
import { logger } from '../../lib/logger';
import { ApiError, type User } from '../../models';
import { LogType } from '../../models/general/log.model';

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

  const { content, title, tags, description } = req.body as {
    content: string;
    title: string;
    description: string;
    tags: string[] | undefined;
  };

  if (!content || !title || !description) {
    logger('Missing content, title or description', LogType.ERROR, req.body);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  // TODO: Content length should be lower?
  if (content.length < 10 || content.length > 10000) {
    logger('Content length is invalid', LogType.ERROR, title);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (title.length < 5 || title.length > 50) {
    logger('Title length is invalid', LogType.ERROR, title);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (description.length < 10 || description.length > 250) {
    logger('Description length is invalid', LogType.ERROR, description);
    return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
  }

  if (tags) {
    if (!Array.isArray(tags)) {
      logger('Tags is not an array', LogType.ERROR, tags);
      return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
    }

    if (tags.length > 3) {
      logger('Too many tags', LogType.ERROR, tags);
      return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
    }

    const validateTags = tags?.every((tag) => tag.length <= 20);
    if (!validateTags) {
      logger('Tags length is invalid', LogType.ERROR, tags);
      return res.status(400).json({ code: ApiError.INVALID_REQUEST_BODY });
    }
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

  const user = await db
    .selectFrom('users')
    .where('authId', '=', decoded.authId)
    .where('authType', '=', decoded.authType)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  const userPosts = await db
    .selectFrom('posts')
    .where('authorId', '=', user.id)
    .select(['createdAt'])
    .execute();

  const postsToday = userPosts.filter(
    (post) =>
      new Date(post.createdAt).getDate() === new Date().getDate() &&
      new Date(post.createdAt).getMonth() === new Date().getMonth() &&
      new Date(post.createdAt).getFullYear() === new Date().getFullYear(),
  );

  if (postsToday.length >= 3) {
    return res.status(429).json({ code: ApiError.POST_LIMIT_REACHED });
  }

  await db
    .insertInto('posts')
    .values({
      authorId: user.id,
      content: content.trim(),
      title: title.trim(),
      tags,
      description: description.trim(),
    })
    .execute();

  return res.status(200).end();
}
