import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { ApiError } from '../../models';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  const sessionCookie = req.cookies?.session;

  if (!sessionCookie) {
    return res.status(403).json({ code: ApiError.MISSING_SESSION_COOKIE });
  }

  res.setHeader(
    'Set-Cookie',
    'session=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT',
  );

  return res.status(200).end();
}
