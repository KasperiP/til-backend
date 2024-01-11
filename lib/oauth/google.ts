import {
  SupportedProviders,
  type GoogleAuthRes,
  type GoogleUserRes,
  type UserCreate,
} from '../../models';

export const loginWithGoogle = async (
  code: string,
): Promise<UserCreate | null> => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI!,
    grant_type: 'authorization_code',
  });

  const formattedUrl =
    'https://oauth2.googleapis.com/token?' + params.toString();

  const accessTokenRes = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'application/json',
    },
  });

  const accessTokenData: GoogleAuthRes = (await accessTokenRes.json()) as any;

  if (!accessTokenData?.access_token) {
    return null;
  }

  const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: {
      Authorization: 'Bearer ' + accessTokenData.access_token,
    },
  });

  const user = (await userRes.json()) as GoogleUserRes;

  return {
    name: user.name || user.email,
    email: user.email || '',
    image: user.picture,
    authType: SupportedProviders.GOOGLE,
  };
};
