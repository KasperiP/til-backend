import { createKysely } from '@vercel/postgres-kysely';
import { type ColumnType, type Generated } from 'kysely';
import { type SupportedProviders } from '../../models';

interface UserTable {
  id: Generated<number>;
  name: string;
  email: string;
  image: string;
  authType: SupportedProviders;
  createdAt: ColumnType<Date, string | undefined, never>;
}

export interface Database {
  users: UserTable;
}

export const db = createKysely<Database>();
export { sql } from 'kysely';
