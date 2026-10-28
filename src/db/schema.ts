import {
  pgEnum,
  pgTable,
  serial,
  text,
  varchar,
  integer,
  timestamp,
  boolean,
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

export const directiveStatusEnum = pgEnum("directive_status", [
  "active",
  "paused",
]);

export const csDirectives = pgTable("cs_directives", {
  id: serial("id").primaryKey(),
  // "laila" (مصر) | "fahd" (السعودية) | "both"
  target: varchar("target", { length: 20 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  content: text("content").notNull(),
  status: directiveStatusEnum("status").notNull().default("active"),
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
// NEBRAS AI — نظام تنفيذ المشاريع (إضافات فوق الجداول الموجودة)
// ============================================================

export const projectStatusEnum = pgEnum("project_status", [
  "intake",
  "needs_info",
  "planned",
  "awaiting_confirm",
  "running",
  "paused",
  "blocked",
  "delivered",
  "cancelled",
  "failed",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "queued",
  "running",
  "done",
  "failed",
  "skipped",
]);

export const priorityEnum = pgEnum("priority_level", [
  "low",
  "normal",
  "high",
  "urgent",
]);

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  code: varchar("code", { length: 16 }).notNull().unique(),
  // مفتاح تكرار آمن: نفس الطلب المكرر لا ينشئ مشروعاً جديداً
  refId: varchar("ref_id", { length: 64 }).unique(),
  orderId: integer("order_id"),
  clientName: varchar("client_name", { length: 120 }).notNull(),
  clientPhone: varchar("client_phone", { length: 40 }),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description").notNull(),
  serviceType: varchar("service_type", { length: 40 })
    .notNull()
    .default("web"),
  status: projectStatusEnum("status").notNull().default("intake"),
  priority: priorityEnum("priority").notNull().default("normal"),
  deadlineWish: varchar("deadline_wish", { length: 120 }),
  scopeIn: text("scope_in"),
  scopeOut: text("scope_out"),
  missingInfo: text("missing_info"),
  feasibility: text("feasibility"),
  plan: text("plan"),
  progress: integer("progress").notNull().default(0),
  deliveryEta: timestamp("delivery_eta", { withTimezone: true }),
  etaConfidence: integer("eta_confidence"),
  estLowMin: integer("est_low_min"),
  estHighMin: integer("est_high_min"),
  // حدود تنفيذ آمنة
  maxFiles: integer("max_files").notNull().default(30),
  maxBytes: integer("max_bytes").notNull().default(400_000),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectRequirements = pgTable("project_requirements", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version: integer("version").notNull().default(1),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aiEmployees = pgTable("ai_employees", {
  id: serial("id").primaryKey(),
  roleKey: varchar("role_key", { length: 30 }).notNull().unique(),
  name: varchar("name", { length: 80 }).notNull(),
  roleTitle: varchar("role_title", { length: 120 }).notNull(),
  team: varchar("team", { length: 40 }).notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  model: varchar("model", { length: 80 }),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectTasks = pgTable("project_tasks", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  seq: integer("seq").notNull(),
  key: varchar("key", { length: 40 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  agentRole: varchar("agent_role", { length: 30 }).notNull(),
  agentName: varchar("agent_name", { length: 80 }),
  dependsOn: text("depends_on"), // ids مفصولة بفواصل
  instructions: text("instructions"),
  weightMin: integer("weight_min").notNull().default(10),
  status: taskStatusEnum("status").notNull().default("queued"),
  attempts: integer("attempts").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(2),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  outputSummary: text("output_summary"),
  error: text("error"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectEvents = pgTable("project_events", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  taskId: integer("task_id"),
  kind: varchar("kind", { length: 30 }).notNull(),
  actor: varchar("actor", { length: 80 }),
  message: text("message").notNull(),
  meta: text("meta"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectFiles = pgTable("project_files", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  path: varchar("path", { length: 240 }).notNull(),
  content: text("content").notNull(),
  action: varchar("action", { length: 12 }).notNull().default("created"),
  version: integer("version").notNull().default(1),
  size: integer("size").notNull().default(0),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectTestResults = pgTable("project_test_results", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  taskId: integer("task_id"),
  name: varchar("name", { length: 160 }).notNull(),
  status: varchar("status", { length: 10 }).notNull(), // pass | fail | error | na
  detail: text("detail"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const deliveryEstimates = pgTable("delivery_estimates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  etaLow: timestamp("eta_low", { withTimezone: true }),
  etaHigh: timestamp("eta_high", { withTimezone: true }),
  confidence: integer("confidence").notNull().default(50),
  basis: text("basis"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 30 }).notNull(),
  decision: varchar("decision", { length: 12 }).notNull(),
  by: varchar("by", { length: 80 }).notNull().default("المطور"),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const clientMessages = pgTable("client_messages", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  sender: varchar("sender", { length: 12 }).notNull(), // client | dev | system
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const modelUsage = pgTable("model_usage", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id"),
  taskId: integer("task_id"),
  roleKey: varchar("role_key", { length: 30 }),
  provider: varchar("provider", { length: 30 }).notNull(),
  model: varchar("model", { length: 80 }).notNull(),
  ok: boolean("ok").notNull().default(true),
  promptChars: integer("prompt_chars").notNull().default(0),
  completionChars: integer("completion_chars").notNull().default(0),
  durationMs: integer("duration_ms").notNull().default(0),
  costUsd: integer("cost_usd"), // بالألفths? لا — بالمليونths: null = غير متاح
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectNotes = pgTable("project_notes", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  from: varchar("from_", { length: 12 }).notNull().default("dev"),
  content: text("content").notNull(),
  consumed: boolean("consumed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectFeedback = pgTable("project_feedback", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  hasIssue: boolean("has_issue").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// NEBRAS AI — قاعدة المعرفة والملكية الفكرية (Knowledge Base)
// ============================================================

export const knowledgeTopics = pgTable("knowledge_topics", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  description: text("description"),
});

export const knowledgeEntries = pgTable("knowledge_entries", {
  id: serial("id").primaryKey(),
  topicKey: varchar("topic_key", { length: 40 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  category: varchar("category", { length: 20 }).notNull(), // concept|guide|example|fix|template|doc
  language: varchar("language", { length: 30 }),
  tech: varchar("tech", { length: 80 }),
  version: varchar("version", { length: 20 }),
  summary: text("summary").notNull(),
  content: text("content").notNull(),
  code: text("code"),
  // مصدر المعلومة (مسجل لكل مدخل): official-docs | company-generated | open-source | platform-tests
  source: varchar("source", { length: 30 }).notNull().default("company-generated"),
  license: varchar("license", { length: 60 }),
  sourceUrl: varchar("source_url", { length: 300 }),
  collectedAt: timestamp("collected_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  verified: boolean("verified").notNull().default(false),
  usageCount: integer("usage_count").notNull().default(0),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  tags: text("tags"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// مستودع الخبرات المكتسبة من مشاريع الشركة (داخلي — لا يعرض للعملاء)
export const projectDecisions = pgTable("project_decisions", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  decision: text("decision").notNull(),
  reason: text("reason"),
  alternatives: text("alternatives"),
  by: varchar("by", { length: 80 }).notNull().default("العقل المركزي"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectLessons = pgTable("project_lessons", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 20 }).notNull(), // error|time|cost|design|process
  problem: text("problem").notNull(),
  solution: text("solution"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const errorFixes = pgTable("error_fixes", {
  id: serial("id").primaryKey(),
  pattern: varchar("pattern", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  cause: text("cause"),
  fix: text("fix").notNull(),
  prevention: text("prevention"),
  occurrences: integer("occurrences").notNull().default(1),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  verified: boolean("verified").notNull().default(false),
});

export const reusableComponents = pgTable("reusable_components", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull().unique(),
  language: varchar("language", { length: 30 }),
  description: text("description"),
  code: text("code"),
  originProjectId: integer("origin_project_id")
    .references(() => projects.id, { onDelete: "set null" }),
  timesUsed: integer("times_used").notNull().default(1),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectEstimateRecords = pgTable("project_estimate_records", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  serviceType: varchar("service_type", { length: 40 }).notNull(),
  estLowMin: integer("est_low_min").notNull(),
  estHighMin: integer("est_high_min").notNull(),
  actualSec: integer("actual_sec").notNull(),
  taskCount: integer("task_count").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
