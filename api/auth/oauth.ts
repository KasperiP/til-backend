import { type VercelRequest, type VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import {
  db,
  loginWithGithub,
  loginWithGoogle,
  loginWithLinkedin,
  seed,
} from '../../lib';
import { ApiError, SupportedProviders, type UserCreate } from '../../models';

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

  const { code, provider } = req.body as {
    code: string;
    provider: SupportedProviders;
  };

  if (!code) {
    return res.status(400).json({ code: ApiError.MISSING_CODE });
  }

  if (!provider) {
    return res.status(400).json({ code: ApiError.MISSING_PROVIDER });
  }

  await seed();

  let userData: UserCreate | null = null;
  switch (provider) {
    case SupportedProviders.GITHUB: {
      userData = await loginWithGithub(code);
      break;
    }
    case SupportedProviders.GOOGLE: {
      userData = await loginWithGoogle(code);
      break;
    }
    case SupportedProviders.LINKEDIN: {
      userData = await loginWithLinkedin(code);
      break;
    }
    default: {
      return res.status(400).json({ code: ApiError.UNSUPPORTED_PROVIDER });
    }
  }

  if (!userData) {
    return res.status(400).json({ code: ApiError.MISSING_ACCESS_TOKEN });
  }

  let user = await db
    .selectFrom('users')
    .where('email', '=', userData.email)
    .selectAll()
    .executeTakeFirst();
  let created = false;

  if (user) {
    if (user.authType !== userData.authType) {
      return res.status(409).json({
        code: ApiError.USER_ALREADY_EXISTS,
        data: {
          provider: user.authType,
        },
      });
    }
  } else {
    created = true;
    user = await db
      .insertInto('users')
      .values({
        name: userData.name,
        email: userData.email,
        image: userData.image,
        authType: userData.authType,
      })
      .returningAll()
      .executeTakeFirst();
  }

  if (!user) {
    return res.status(500).end();
  }

  const token = jwt.sign(user, process.env.JWT_SECRET!, {
    expiresIn: '1y',
  });

  res.setHeader('Set-Cookie', [
    `session=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=31536000; Secure`,
  ]);

  return res.status(created ? 201 : 200).json(user);
}
