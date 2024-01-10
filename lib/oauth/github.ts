import {
  GithubAuthRes,
  GithubUserRes,
  SupportedProviders,
  UserCreate,
} from '../../models';

export const loginWithGithub = async (
  code: string,
): Promise<UserCreate | null> => {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID!,
    client_secret: process.env.GITHUB_CLIENT_SECRET!,
    code,
  });

  const formattedUrl = `https://github.com/login/oauth/access_token?` + params;

  const accessTokenRes = await fetch(formattedUrl, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'application/json',
    },
  });

  const accessTokenData: GithubAuthRes = (await accessTokenRes.json()) as any;
  if (!accessTokenData || !accessTokenData.access_token) {
    return null;
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: 'Bearer ' + accessTokenData.access_token,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });

  const user = (await userRes.json()) as GithubUserRes;

  return {
    name: user.name || user.login,
    email: user.email || '',
    image: user.avatar_url,
    authType: SupportedProviders.GITHUB,
  };
};
