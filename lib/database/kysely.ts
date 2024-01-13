import { createKysely } from '@vercel/postgres-kysely';
import { type ColumnType, type Generated } from 'kysely';
import { type SupportedProviders } from '../../models';

interface UserTable {
  id: Generated<number>;
  name: string;
  email: string;
  image: string;
  authType: SupportedProviders;
  authId: string;
  createdAt: ColumnType<Date, string | undefined, never>;
}

interface PostTable {
  id: Generated<number>;
  title: string;
  content: string;
  tags?: string[] | null;
  authorId: number;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface Database {
  users: UserTable;
  posts: PostTable;
}

export const db = createKysely<Database>();
export { sql } from 'kysely';
