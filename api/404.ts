import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_: VercelRequest, res: VercelResponse) {
  res.status(404).json({ message: 'Not found' });
}
