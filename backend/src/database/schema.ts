import { integer, pgTable, timestamp, varchar } from 'drizzle-orm/pg-core'

export const UsersTable = pgTable('users', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})

export const DevicesTable = pgTable('devices', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  userId: integer()
    .notNull()
    .references(() => UsersTable.id),
  name: varchar({ length: 255 }).notNull(),
  createdAt: timestamp('createdAt').defaultNow().notNull()
})
