import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
export const clubs = sqliteTable('clubs', {id: text('id').primaryKey(), owner: text('owner').notNull(), invite: text('invite').notNull().unique(), created: integer('created').notNull()});
export const members = sqliteTable('members', {actor: text('actor').primaryKey(), club: text('club').notNull().references(() => clubs.id), role: text('role').notNull()});
export const careers = sqliteTable('careers', {club: text('club').primaryKey().references(() => clubs.id), state: text('state').notNull(), version: integer('version').notNull().default(0)});
export const events = sqliteTable('events', {id: text('id').primaryKey(), club: text('club').notNull().references(() => clubs.id), payload: text('payload').notNull(), created: integer('created').notNull()});
export const phrases = sqliteTable('phrases', {id: text('id').primaryKey(), club: text('club').notNull().references(() => clubs.id), phrase: text('phrase').notNull(), meaning: text('meaning').notNull(), context: text('context').notNull(), category: text('category').notNull(), audio: text('audio'), source: text('source'), created: integer('created').notNull()});
