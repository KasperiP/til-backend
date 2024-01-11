import { type VercelRequest } from '@vercel/node';

export default function middleware(req: VercelRequest): any {
  if (req.method === 'OPTIONS') {
    return Response.json({}, { status: 200 });
  }
}
