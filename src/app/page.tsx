import { db } from "@/db";
import { aiDevs, projects, securityAgents, services, staff } from "@/db/schema";
import { ensureSeeded, getSettings } from "@/lib/seed";
import { isDbAlive } from "@/lib/db-check";
import { asc, desc, eq } from "drizzle-orm";
import { DAY_NAMES } from "@/lib/nova-ai";
import type { SiteDev, SiteProject, SiteSecurityAgent, SiteService, SiteStaff } from "@/lib/types";

import Nav from "@/components/site/nav";
import Hero from "@/components/site/hero";
import ChatWidget from "@/components/site/chat-widget";
import { MarqueeStrip, Testimonials } from "@/components/site/extras";
import { Services, Pricing } from "@/components/site/services";
import { CyberDefense } from "@/components/site/cyber-defense";
import SocialIdeas from "@/components/site/social-ideas";
import KeepAlivePulse from "@/components/site/keepalive-pulse";
import Team from "@/components/site/team";
import Work from "@/components/site/work";
import OrderSection from "@/components/site/order-section";
import TrackSection from "@/components/site/track-section";
import Contact from "@/components/site/contact";
import Footer from "@/components/site/footer";

export const dynamic = "force-dynamic";

export default async function Home() {
  let devs: SiteDev[] = [];
  let projs: SiteProject[] = [];
  let catalog: SiteService[] = [];
  let team: SiteStaff[] = [];
  let secAgents: SiteSecurityAgent[] = [];
  let hoursLabel = "يوميًا — الردود فورية";

  try {
    if (await isDbAlive()) {
      await ensureSeeded();
      const s = await getSettings();
      const days = JSON.parse(s.work_days || "[]") as number[];
      const dl = days.length === 7 ? "يوميًا" : days.map((d) => DAY_NAMES[d]).join("، ");
      hoursLabel = `${dl} — من ${s.hours_start} لـ ${s.hours_end}`;

      devs = await db.select().from(aiDevs).orderBy(asc(aiDevs.id));
      projs = await db.select().from(projects).orderBy(desc(projects.id));
      catalog = await db.select().from(services).where(eq(services.active, true)).orderBy(asc(services.id));
      team = await db.select().from(staff).orderBy(asc(staff.id));
      secAgents = (await db.select().from(securityAgents).orderBy(asc(securityAgents.id))).map((a) => ({
        ...a,
        createdAt: a.createdAt.toISOString(),
      }));
    }
  } catch (e) {
    console.error("home data", e);
  }

  return (
    <main className="noise relative">
      <Nav />
      <Hero />
      <MarqueeStrip />
      <Services />
      <OrderSection services={catalog} />
      <CyberDefense agents={secAgents} />
      <Team devs={devs} staff={team} />
      <Work projects={projs} />
      <Pricing />
      <TrackSection />
      <SocialIdeas />
      <Testimonials />
      <Contact hoursLabel={hoursLabel} />
      <Footer />
      <KeepAlivePulse />
      <ChatWidget />
    </main>
  );
}
