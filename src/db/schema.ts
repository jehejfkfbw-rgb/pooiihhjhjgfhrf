import {
  boolean,
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
} from "drizzle-orm/pg-core";

export const requestStatusEnum = pgEnum("request_status", [
  "new",
  "pending",
  "approved",
  "rejected",
]);

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  clientName: varchar("client_name", { length: 120 }).notNull(),
  phone: varchar("phone", { length: 40 }).notNull(),
  service: varchar("service", { length: 160 }).notNull(),
  budget: varchar("budget", { length: 120 }),
  details: text("details").notNull(),
  status: requestStatusEnum("status").notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const devTasks = pgTable("dev_tasks", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "cascade",
  }),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content"),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const marketingPosts = pgTable("marketing_posts", {
  id: serial("id").primaryKey(),
  agentName: varchar("agent_name", { length: 120 }).notNull(),
  platform: varchar("platform", { length: 60 }).notNull(),
  topic: varchar("topic", { length: 200 }).notNull(),
  content: text("content").notNull(),
  status: requestStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id", { length: 80 }).notNull(),
  agentName: varchar("agent_name", { length: 120 }),
  role: varchar("role", { length: 12 }).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// الموظفون البشريون (فريق خدمة العملاء/التسويق) — لهم بوابة منفصلة
// لوحة المطور/المدير هي التي تُسند لهم العمل، وهم ينفذونه فقط.
// ============================================================

export const assignmentStatusEnum = pgEnum("assignment_status", [
  "assigned",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
]);

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  username: varchar("username", { length: 60 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: varchar("role", { length: 30 }).notNull().default("cs"),
  title: varchar("title", { length: 160 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const assignments = pgTable("assignments", {
  id: serial("id").primaryKey(),
  staffId: integer("staff_id")
    .notNull()
    .references(() => staff.id, { onDelete: "cascade" }),
  orderId: integer("order_id").references(() => orders.id, {
    onDelete: "set null",
  }),
  title: varchar("title", { length: 200 }).notNull(),
  instructions: text("instructions"),
  output: text("output"),
  adminNote: text("admin_note"),
  status: assignmentStatusEnum("status").notNull().default("assigned"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
