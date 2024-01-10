import { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { db } from '../../lib/kysely';
import { loginWithGithub } from '../../lib/oauth/github';
import { loginWithGoogle } from '../../lib/oauth/google';
import { loginWithLinkedin } from '../../lib/oauth/linkedin';
import { seed } from '../../lib/seed';
import { SupportedProviders, UserCreate } from '../../models/auth.model';
import { ApiError } from '../../models/errors.model';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ code: ApiError.METHOD_NOT_ALLOWED });
  }

  if (!req.body) {
    return res.status(400).json({ code: ApiError.MISSING_BODY });
  }

  const { code, provider } = req.body;

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
        authType: SupportedProviders.GITHUB,
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

  return res.status(created ? 201 : 200).end();
}