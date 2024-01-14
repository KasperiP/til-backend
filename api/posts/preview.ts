import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { db, logger, seed } from '../../lib';
import { ApiError, LogType } from '../../models';

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
      content: removeMarkdown(post.content).substring(0, 300).trim(),
      likes: parseInt(post.likes as string, 10),
    };
  });

  return res.status(200).json({
    posts: formattedPosts.slice(0, formattedLimit),
    hasMore,
  });
}

/**
 * This function is nowhere near perfect, but it's good enough for now.
 * It is meant to remove markdown from a string for preview purposes. When
 * the user clicks on a post, the full markdown will be displayed.
 * @param markdownText text to remove markdown from
 * @returns plain text
 */
function removeMarkdown(markdownText: string): string {
  const regexPatterns: Array<[RegExp, string]> = [
    // Headers
    [/###### (.*$)/gm, '$1'], // H6
    [/##### (.*$)/gm, '$1'], // H5
    [/#### (.*$)/gm, '$1'], // H4
    [/### (.*$)/gm, '$1'], // H3
    [/## (.*$)/gm, '$1'], // H2
    [/# (.*$)/gm, '$1'], // H1
    // Styles
    [/\*\*(.*?)\*\*/g, '$1'], // Bold
    [/__(.*?)__/g, '$1'], // Bold
    [/\*(.*?)\*/g, '$1'], // Italic
    [/_(.*?)_/g, '$1'], // Italic
    [/`(.*?)`/g, '$1'], // Inline code
    [/!\[(.*?)\]\((.*?)\)/g, '$1'], // Images (keep alt text)
    [/\[(.*?)\]\((.*?)\)/g, '$1'], // Links (keep link text)
    // Lists
    [/(\n- (.*))/g, '$2'], // Unordered lists
    [/(\n\d\. (.*))/g, '$2'], // Ordered lists
    // Others
    [/~~(.*?)~~/g, '$1'], // Strikethrough
    [/\n```(.*?)\n```/gs, '$1'], // Block code (keep code content)
    [/---/g, ''], // Horizontal rule
    [/^\n/g, ''], // New line at start
    [/(\n> (.*))/g, '$2'], // Blockquotes
    [/\n/g, ' '], // New lines
    [/\s{2,}/g, ' '],
  ];

  let plainText = markdownText;
  regexPatterns.forEach(([pattern, replacement]) => {
    plainText = plainText.replace(pattern, replacement);
  });

  return plainText.trim();
}
