import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db, seed } from '../../lib';
import { ApiError, type User } from '../../models';

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

  const user = await db
    .selectFrom('users')
    .where('authId', '=', decoded.authId)
    .where('authType', '=', decoded.authType)
    .selectAll()
    .executeTakeFirst();

  if (!user) {
    return res.status(404).json({ code: ApiError.NOT_FOUND });
  }

  return res.status(200).json(user);
}
