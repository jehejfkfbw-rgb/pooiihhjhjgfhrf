export type SiteDev = {
  id: number;
  code: string;
  name: string;
  role: string;
  stack: string;
  avatar: string;
  level: number;
  xp: number;
  projectsDone: number;
  status: string;
  mission: string;
};

export type SiteProject = {
  id: number;
  title: string;
  client: string;
  type: string;
  description: string;
  tech: string;
  status: string;
  progress: number;
  budget: number;
  year: string;
};

export type SiteLead = {
  id: number;
  name: string;
  phone: string;
  service: string;
  message: string;
  status: string;
  createdAt: string;
};

export type SiteKnowledge = {
  id: number;
  category: string;
  patterns: string[];
  answer: string;
  active: boolean;
  priority: number;
  hits: number;
};

export type SiteChat = {
  id: number;
  sessionId: string;
  question: string;
  answer: string;
  matched: boolean;
  inHours: boolean;
  createdAt: string;
};

export type SiteService = {
  id: number;
  name: string;
  category: string;
  description: string;
  price: number;
  deliveryDays: number;
  features: string[];
  popular: boolean;
  active: boolean;
};

export type SiteStaff = {
  id: number;
  name: string;
  role: string;
  dept: string;
  online: boolean;
};

export type OrderEvent = { t: string; text: string };

export type SiteOrder = {
  id: number;
  code: string;
  name: string;
  phone: string;
  serviceId: number;
  serviceName: string;
  details: string;
  price: number;
  deliveryDays: number;
  status: string;
  progress: number;
  assignee: string;
  agentId: number;
  deadline: string | null;
  deliverable: string;
  deliverableName: string;
  events: OrderEvent[];
  createdAt: string;
};

export type SiteSecurityAgent = {
  id: number;
  code: string;
  name: string;
  role: string;
  specialty: string;
  model: string;
  status: string;
  confidence: number;
  responseMs: number;
  mission: string;
  createdAt: string;
};

export type SiteSecurityEvent = {
  id: number;
  type: string;
  severity: string;
  source: string;
  path: string;
  method: string;
  ip: string;
  userAgent: string;
  score: number;
  blocked: boolean;
  summary: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type SiteSecurityReport = {
  id: number;
  title: string;
  mode: string;
  summary: string;
  stats: Record<string, unknown>;
  recommendations: string[];
  createdAt: string;
};
