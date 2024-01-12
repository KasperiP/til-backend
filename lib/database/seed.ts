import { db, sql } from './kysely';

export async function seed(): Promise<Record<any, void>> {
  const createUsersTable = await db.schema
    .createTable('users')
    .ifNotExists()
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('name', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('email', 'varchar(255)', (cb) => cb.notNull().unique())
    .addColumn('image', 'varchar(255)')
    .addColumn('authType', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('authId', 'varchar(255)', (cb) => cb.notNull().unique())
    .addColumn('createdAt', sql`timestamp with time zone`, (cb) =>
      cb.defaultTo(sql`current_timestamp`),
    )
    .execute();

  const createPostsTable = await db.schema
    .createTable('posts')
    .ifNotExists()
    .addColumn('id', 'serial', (cb) => cb.primaryKey())
    .addColumn('title', 'varchar(255)', (cb) => cb.notNull())
    .addColumn('content', 'text', (cb) => cb.notNull())
    .addColumn('tags', sql`text[]`)
    .addColumn('authorId', 'integer', (cb) =>
      cb.references('users.id').notNull(),
    )
    .addColumn('createdAt', sql`timestamp with time zone`, (cb) =>
      cb.defaultTo(sql`current_timestamp`),
    )
    .execute();

  console.log('Tables created');

  return {
    createUsersTable,
    createPostsTable,
  };
}
