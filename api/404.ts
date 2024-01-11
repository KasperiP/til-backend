import { type VercelRequest, type VercelResponse } from '@vercel/node';
import { ApiError } from '../models';

export default async function handler(
  _: VercelRequest,
  res: VercelResponse,
): Promise<VercelResponse> {
  return res.status(404).json({ code: ApiError.NOT_FOUND });
}
