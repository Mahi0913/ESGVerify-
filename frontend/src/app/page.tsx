"use client";

import { motion } from "framer-motion";
import { Shield, Search, Brain, FileText, ArrowRight, Zap, BarChart3, Factory, Users, Globe2, CheckCircle2, Leaf } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.7 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.1 } },
};

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 50,
        backgroundColor: "rgba(15, 43, 30, 0.9)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)"
      }}>
        <div style={{
          maxWidth: "1200px", margin: "0 auto", padding: "0 24px",
          height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "28px", height: "28px", color: "#D4A843" }} />
            <span style={{
              fontSize: "20px", fontWeight: 700, color: "white",
              fontFamily: "var(--font-heading), system-ui, sans-serif"
            }}>ESGVerify</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <Link href="/login" style={{
              color: "rgba(255,255,255,0.7)", fontSize: "14px", fontWeight: 500,
              textDecoration: "none"
            }}>Log in</Link>
            <Link href="/login?mode=signup" style={{
              border: "1px solid rgba(255,255,255,0.3)", color: "white",
              padding: "8px 20px", borderRadius: "8px", fontSize: "14px",
              fontWeight: 600, textDecoration: "none"
            }}>Get Started</Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="gradient-hero" style={{ position: "relative", paddingTop: "140px", paddingBottom: "120px", overflow: "hidden" }}>
        {/* Floating orbs */}
        <div className="animate-float" style={{
          position: "absolute", top: "60px", left: "10%", width: "300px", height: "300px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(45,106,79,0.4), transparent)",
          filter: "blur(60px)", pointerEvents: "none"
        }} />
        <div className="animate-float-slow" style={{
          position: "absolute", bottom: "40px", right: "15%", width: "250px", height: "250px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.2), transparent)",
          filter: "blur(50px)", pointerEvents: "none"
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          style={{ position: "relative", zIndex: 10, textAlign: "center", maxWidth: "800px", margin: "0 auto", padding: "0 24px" }}
        >
          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            backgroundColor: "rgba(212,168,67,0.15)", color: "#D4A843",
            padding: "6px 16px", borderRadius: "999px", fontSize: "13px",
            fontWeight: 500, marginBottom: "28px", border: "1px solid rgba(212,168,67,0.2)"
          }}>
            <Zap style={{ width: "14px", height: "14px" }} />
            SEBI BRSR Compliant · FY 2026-27 Ready
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(40px, 6vw, 72px)", fontWeight: 700,
            color: "white", lineHeight: 1.1, marginBottom: "24px",
            fontFamily: "var(--font-heading), system-ui, sans-serif"
          }}>
            ESG Compliance{" "}
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: "18px", color: "rgba(255,255,255,0.65)",
            maxWidth: "600px", margin: "0 auto 40px", lineHeight: 1.6
          }}>
            AI-powered ESG scoring for Indian MSMEs. Enter your numbers,
            get AI-verified reports your buyers will trust.
          </p>

          {/* CTAs */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", flexWrap: "wrap" }}>
            <Link href="/login?mode=signup" className="glow-gold" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              backgroundColor: "#D4A843", color: "#1B4332", padding: "14px 32px",
              borderRadius: "12px", fontSize: "16px", fontWeight: 700,
              textDecoration: "none"
            }}>
              Start Free Assessment
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Link>
            <Link href="#how-it-works" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              border: "1px solid rgba(255,255,255,0.3)", color: "white",
              padding: "14px 32px", borderRadius: "12px", fontSize: "16px",
              fontWeight: 500, textDecoration: "none"
            }}>
              View Methodology
            </Link>
          </div>
        </motion.div>

        {/* Wave separator */}
        <div className="wave-separator">
          <svg viewBox="0 0 1440 80" preserveAspectRatio="none">
            <path fill="#F5F1EB" d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" />
          </svg>
        </div>
      </section>

      {/* ─── TRUST MARQUEE ─── */}
      <section style={{ backgroundColor: "white", borderTop: "1px solid #E2E0DB", borderBottom: "1px solid #E2E0DB", padding: "20px 0", overflow: "hidden", position: "relative" }}>
        {/* Fade edges */}
        <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: "80px", background: "linear-gradient(to right, white, transparent)", zIndex: 2, pointerEvents: "none" }} />
        <div style={{ position: "absolute", top: 0, right: 0, bottom: 0, width: "80px", background: "linear-gradient(to left, white, transparent)", zIndex: 2, pointerEvents: "none" }} />

        <style>{`
    @keyframes marquee-scroll {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    .marquee-track {
      display: flex;
      width: max-content;
      animation: marquee-scroll 28s linear infinite;
    }
    .marquee-track:hover { animation-play-state: paused; }
  `}</style>

        <div className="marquee-track">
          {[...Array(2)].flatMap(() => [
            { label: "SEBI BRSR Aligned", gold: false },
            { label: "AI Verified Scoring", gold: false },
            { label: "Fuzzy Logic Engine", gold: false },
            { label: "Audit Ready Reports", gold: false },
            { label: "Data Credibility Checks", gold: false },
            { label: "Buyer Specific Weighting", gold: false },
            { label: "Worker Safety Metrics", gold: false },
            { label: "MSME Focused Design", gold: false },
            { label: "Free to Start", gold: true },
            { label: "20+ Industries", gold: false },
          ]).map((item, i) => (
            <div key={i} style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "0 32px", whiteSpace: "nowrap" }}>
              <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#D4A843", flexShrink: 0 }} />
              {item.gold
                ? <Leaf style={{ width: "16px", height: "16px", color: "#D4A843" }} />
                : <CheckCircle2 style={{ width: "16px", height: "16px", color: "#2D6A4F" }} />
              }
              <span style={{
                fontSize: "12px", fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: item.gold ? "#B8892A" : "#1B4332"
              }}>{item.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── WHY ESGVerify ─── */}
      <section style={{ padding: "60px 24px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <h2 style={{
            fontSize: "36px", fontWeight: 700, color: "#1B4332", marginBottom: "12px",
            fontFamily: "var(--font-heading)"
          }}>Why MSMEs Choose ESGVerify</h2>
          <p style={{ fontSize: "16px", color: "#6B7280" }}>
            Built specifically for Indian MSMEs navigating SEBI&apos;s BRSR requirements
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "24px" }}>
          {[
            { icon: Search, title: "Live Buyer Search", desc: "AI searches the web for your buyer's specific ESG requirements and tells you exactly what they expect.", link: "Learn more" },
            { icon: Shield, title: "Fuzzy Logic Verification", desc: "Our fuzzy inference system gives you nuanced confidence scores with explanations.", link: "Learn more" },
            { icon: FileText, title: "Audit-Ready Reports", desc: "One click PDF reports with all KPIs, verification data, and improvement plans.", link: "Learn more" },
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              style={{
                backgroundColor: "white", borderRadius: "16px", padding: "32px",
                border: "1px solid #E2E0DB", cursor: "pointer",
                transition: "box-shadow 0.3s, border-color 0.3s"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 8px 30px rgba(27,67,50,0.08)";
                e.currentTarget.style.borderColor = "rgba(45,106,79,0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "#E2E0DB";
              }}
            >
              <div style={{
                width: "48px", height: "48px", borderRadius: "12px",
                backgroundColor: "#F5F1EB", display: "flex", alignItems: "center",
                justifyContent: "center", marginBottom: "24px"
              }}>
                <feature.icon style={{ width: "22px", height: "22px", color: "#1B4332" }} />
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "10px" }}>{feature.title}</h3>
              <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7, marginBottom: "16px" }}>{feature.desc}</p>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#D4A843", fontSize: "14px", fontWeight: 600 }}>
                {feature.link}
                <ArrowRight style={{ width: "14px", height: "14px" }} />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── THREE STEPS ─── */}
      <section id="how-it-works" style={{ padding: "80px 24px", backgroundColor: "#EDE9E0" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <h2 style={{
            fontSize: "36px", fontWeight: 700, color: "#1B4332",
            textAlign: "center", marginBottom: "60px",
            fontFamily: "var(--font-heading)"
          }}>Three Steps to Compliance</h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "48px" }}>
            {[
              { step: "01", title: "Enter Your Numbers", desc: "Electricity bills, water usage, worker count you already know." },
              { step: "02", title: "AI Verifies & Scores", desc: "Cross checks validation of your data. Fuzzy logic gives nuanced, fair scores." },
              { step: "03", title: "Get Your Report", desc: "Download audit-ready BRSR reports. See exactly what to improve and by how much." },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                viewport={{ once: true }}
              >
                <div style={{
                  fontSize: "72px", fontWeight: 800, color: "rgba(27,67,50,0.08)",
                  lineHeight: 1, marginBottom: "12px",
                  fontFamily: "var(--font-heading)"
                }}>{item.step}</div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "10px" }}>{item.title}</h3>
                <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.7 }}>{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA BANNER ─── */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="gradient-hero"
            style={{ borderRadius: "24px", padding: "64px 40px", textAlign: "center", position: "relative", overflow: "hidden" }}
          >
            <Globe2 style={{ width: "40px", height: "40px", color: "#D4A843", margin: "0 auto 20px" }} />
            <h2 style={{
              fontSize: "36px", fontWeight: 700, color: "white", marginBottom: "16px",
              fontFamily: "var(--font-heading)"
            }}>Ready to Get Compliant?</h2>
            <p style={{ fontSize: "16px", color: "rgba(255,255,255,0.6)", maxWidth: "500px", margin: "0 auto 32px" }}>
              Join thousands of MSMEs preparing for SEBI&apos;s BRSR mandate. Free to start.
            </p>
            <Link href="/login?mode=signup" className="glow-gold" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              backgroundColor: "#D4A843", color: "#1B4332", padding: "14px 32px",
              borderRadius: "12px", fontSize: "16px", fontWeight: 700,
              textDecoration: "none"
            }}>
              Get Started Free
              <ArrowRight style={{ width: "18px", height: "18px" }} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid #E2E0DB", padding: "24px" }}>
        <div style={{
          maxWidth: "1100px", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "18px", height: "18px", color: "#1B4332" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <span style={{ fontSize: "12px", color: "#6B7280" }}>© 2026 ESGVerify</span>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <CheckCircle2 style={{ width: "14px", height: "14px", color: "#2D6A4F" }} />
              <span style={{ fontSize: "12px", color: "#6B7280" }}>SEBI BRSR Aligned</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}