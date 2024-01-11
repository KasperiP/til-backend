import {
  SupportedProviders,
  type LinkedInAuthRes,
  type LinkedInUserRes,
  type UserCreate,
} from '../../models';

export const loginWithLinkedin = async (
  code: string,
): Promise<UserCreate | null> => {
  const params = new URLSearchParams({
    client_id: process.env.LINKEDIN_CLIENT_ID!,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET!,
    code,
    redirect_uri: 'https://til.kassq.dev/auth/oauth/linkedin/callback',
    grant_type: 'authorization_code',
  });

  const formattedUrl =
    'https://www.linkedin.com/oauth/v2/accessToken?' + params.toString();

  const accessTokenRes = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });

  const accessTokenData: any = (await accessTokenRes.json()) as LinkedInAuthRes;

  if (!accessTokenData?.access_token) {
    return null;
  }

  const userRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: {
      Authorization: 'Bearer ' + accessTokenData.access_token,
    },
  });

  const user = (await userRes.json()) as LinkedInUserRes;

  return {
    name: user.name || user.email,
    email: user.email || '',
    image: user.picture,
    authType: SupportedProviders.LINKEDIN,
  };
};
