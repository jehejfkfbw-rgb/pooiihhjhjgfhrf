"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { Navbar } from "./Navbar";
import { Hero } from "./Hero";
import { ServicesSection } from "./ServicesSection";
import { AgentsSection } from "./AgentsSection";
import { ProcessSection } from "./ProcessSection";
import { OrderForm } from "./OrderForm";
import { ContactSection } from "./ContactSection";
import { Footer } from "./Footer";
import { ChatWidget } from "./ChatWidget";
import { WHATSAPP_LINK } from "@/lib/site";

export function HomeClient() {
  const [chatOpen, setChatOpen] = useState(false);
  const toggleChat = () => setChatOpen((v) => !v);

  return (
    <main className="relative min-h-screen bg-nova-950">
      <Navbar onOpenChat={toggleChat} />
      <Hero onOpenChat={toggleChat} />
      <ServicesSection />
      <AgentsSection />
      <ProcessSection />
      <OrderForm />
      <ContactSection />
      <Footer />

      <ChatWidget open={chatOpen} onToggle={toggleChat} />

      {/* زر واتساب عائم */}
      <a
        href={WHATSAPP_LINK}
        target="_blank"
        aria-label="تواصل واتساب"
        className="fixed bottom-6 end-6 z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500 text-white shadow-[0_14px_44px_-10px_rgba(16,185,129,0.7)] transition hover:scale-105 hover:bg-emerald-400"
      >
        <MessageCircle size={24} />
      </a>
    </main>
  );
}
