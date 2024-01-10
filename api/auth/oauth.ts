import { VercelRequest, VercelResponse } from '@vercel/node';
import { db } from '../../lib/kysely';
import { loginWithGithub } from '../../lib/oauth/github';
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

  const isSupported = Object.values(SupportedProviders).includes(provider);
  if (!isSupported) {
    return res.status(400).json({ code: ApiError.UNSUPPORTED_PROVIDER });
  }

  await seed();

  let userData: UserCreate | null = null;
  switch (provider) {
    case SupportedProviders.GITHUB: {
      userData = await loginWithGithub(code);
    }
  }

  if (!userData) {
    return res.status(400).json({ code: ApiError.MISSING_ACCESS_TOKEN });
  }

  const existingUser = await db
    .selectFrom('users')
    .where('email', '=', userData.email)
    .execute();

  if (existingUser.length) {
    return res.status(409).json({ code: ApiError.USER_ALREADY_EXISTS });
  }

  await db
    .insertInto('users')
    .values({
      name: userData.name,
      email: userData.email,
      image: userData.image,
      authType: SupportedProviders.GITHUB,
    })
    .execute();

  return res.status(201).end();
}
