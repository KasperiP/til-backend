export interface LinkedInAuthRes {
  access_token: string;
  expires_in: number;
}

export interface LinkedInUserRes {
  sub: string;
  email_verified: boolean;
  name: string;
  locale: {
    country: string;
    language: string;
  };
  given_name: string;
  family_name: string;
  email: string;
  picture: string;
}
