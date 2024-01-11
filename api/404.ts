import { type VercelRequest, type VercelResponse } from '@vercel/node';

export default async function handler(
  _: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  return res.status(404).json({ message: 'Not found' });
}
