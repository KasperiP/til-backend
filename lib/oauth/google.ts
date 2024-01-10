import {
  GoogleAuthRes,
  GoogleUserRes,
  SupportedProviders,
  UserCreate,
} from '../../models';

export const loginWithGoogle = async (
  code: string,
): Promise<UserCreate | null> => {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    code,
    redirect_uri: 'http://localhost:4200/auth/oauth/google/callback',
    grant_type: 'authorization_code',
  });

  const formattedUrl = `https://oauth2.googleapis.com/token?` + params;

  const accessTokenRes = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'application/json',
    },
  });

  const accessTokenData: GoogleAuthRes = (await accessTokenRes.json()) as any;

  if (!accessTokenData || !accessTokenData.access_token) {
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
