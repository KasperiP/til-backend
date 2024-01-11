import { type VercelRequest, type VercelResponse } from '@vercel/node';

export default function middleware(
  req: VercelRequest,
  res: VercelResponse,
): VercelResponse | undefined {
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
}
