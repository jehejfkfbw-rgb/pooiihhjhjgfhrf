import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
} from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  client: text("client").notNull().default(""),
  type: text("type").notNull().default("website"),
  description: text("description").notNull().default(""),
  tech: text("tech").notNull().default(""),
  status: text("status").notNull().default("ongoing"),
  progress: integer("progress").notNull().default(0),
  budget: integer("budget").notNull().default(0),
  year: text("year").notNull().default("2025"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const aiDevs = pgTable("ai_devs", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  stack: text("stack").notNull().default(""),
  avatar: text("avatar").notNull().default("/img/dev-1.png"),
  level: integer("level").notNull().default(10),
  xp: integer("xp").notNull().default(50),
  projectsDone: integer("projects_done").notNull().default(0),
  status: text("status").notNull().default("online"),
  mission: text("mission").notNull().default(""),
});

export const knowledge = pgTable("knowledge", {
  id: serial("id").primaryKey(),
  category: text("category").notNull().default("عام"),
  patterns: jsonb("patterns").$type<string[]>().notNull().default([]),
  answer: text("answer").notNull(),
  active: boolean("active").notNull().default(true),
  priority: integer("priority").notNull().default(1),
  hits: integer("hits").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull().default(""),
  service: text("service").notNull().default(""),
  message: text("message").notNull().default(""),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatLogs = pgTable("chat_logs", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().default(""),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  matched: boolean("matched").notNull().default(false),
  inHours: boolean("in_hours").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull().default("web"),
  description: text("description").notNull().default(""),
  price: integer("price").notNull().default(0),
  deliveryDays: integer("delivery_days").notNull().default(7),
  features: jsonb("features").$type<string[]>().notNull().default([]),
  popular: boolean("popular").notNull().default(false),
  active: boolean("active").notNull().default(true),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  userId: text("user_id").notNull().default(""),
  serviceId: integer("service_id").notNull().default(0),
  serviceName: text("service_name").notNull().default(""),
  details: text("details").notNull().default(""),
  price: integer("price").notNull().default(0),
  deliveryDays: integer("delivery_days").notNull().default(7),
  status: text("status").notNull().default("new"), // new | accepted | inprogress | review | delivered | rejected
  progress: integer("progress").notNull().default(0),
  assignee: text("assignee").notNull().default(""),
  agentId: integer("agent_id").notNull().default(0),
  deadline: timestamp("deadline"),
  deliverable: text("deliverable").notNull().default(""),
  deliverableName: text("deliverable_name").notNull().default(""),
  draftCode: text("draft_code").notNull().default(""),
  draftName: text("draft_name").notNull().default(""),
  draftAt: timestamp("draft_at"),
  events: jsonb("events").$type<{ t: string; text: string }[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const staff = pgTable("staff", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull().default(""),
  dept: text("dept").notNull().default(""),
  online: boolean("online").notNull().default(true),
});

export const securityAgents = pgTable("security_agents", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  specialty: text("specialty").notNull().default(""),
  model: text("model").notNull().default("NOVA SENTINEL"),
  status: text("status").notNull().default("watching"), // watching | scanning | defending | maintenance
  confidence: integer("confidence").notNull().default(90),
  responseMs: integer("response_ms").notNull().default(120),
  mission: text("mission").notNull().default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityEvents = pgTable("security_events", {
  id: serial("id").primaryKey(),
  type: text("type").notNull().default("traffic"), // traffic | probe | xss | sqli | bruteforce | vuln-scan | lockdown
  severity: text("severity").notNull().default("low"), // low | medium | high | critical
  source: text("source").notNull().default("web"),
  path: text("path").notNull().default(""),
  method: text("method").notNull().default("GET"),
  ip: text("ip").notNull().default(""),
  userAgent: text("user_agent").notNull().default(""),
  score: integer("score").notNull().default(0),
  blocked: boolean("blocked").notNull().default(false),
  summary: text("summary").notNull().default(""),
  payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const securityReports = pgTable("security_reports", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  mode: text("mode").notNull().default("scan"), // scan | shift | emergency
  summary: text("summary").notNull().default(""),
  stats: jsonb("stats").$type<Record<string, unknown>>().notNull().default({}),
  recommendations: jsonb("recommendations").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const socialIdeas = pgTable("social_ideas", {
  id: serial("id").primaryKey(),
  day: text("day").notNull(), // YYYY-MM-DD بتوقيت القاهرة
  title: text("title").notNull(),
  body: text("body").notNull(),
  hashtags: jsonb("hashtags").$type<string[]>().notNull().default([]),
  bestTime: text("best_time").notNull().default(""),
  platform: text("platform").notNull().default(""),
  source: text("source").notNull().default("local"), // gemini | local
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
