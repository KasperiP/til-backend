export enum SupportedProviders {
  GITHUB = 'github',
  GOOGLE = 'google',
  LINKEDIN = 'linkedin',
}

export interface User {
  id: number;
  name: string;
  email: string;
  image: string;
  authType: SupportedProviders;
  createdAt: Date;
}

export type UserCreate = Omit<User, 'id' | 'createdAt'>;
