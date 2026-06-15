"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Leaf, ArrowRight, ArrowLeft, Globe2, Shield, BarChart3, FileText, Factory, Users, Zap, CheckCircle2, AlertTriangle } from "lucide-react";

var slides = [
    {
        id: 1,
        icon: Zap,
        iconBg: "#FFF8E1",
        iconColor: "#D4A843",
        title: "Something is changing in business",
        subtitle: "And most MSMEs don’t see it yet",
        points: [
            { icon: Factory, text: "Large buyers are quietly changing how they select suppliers" },
            { icon: BarChart3, text: "It’s no longer just price and quality" },
            { icon: Shield, text: "They now want proof of how your business operates" },
        ],
        bottomNote: "This shift is already happening not in the future.",
    },

    {
        id: 2,
        icon: Globe2,
        iconBg: "#E8F5E9",
        iconColor: "#2D6A4F",
        title: "That proof is called ESG ",
        subtitle: "And it’s becoming a standard",
        points: [
            { icon: Leaf, text: "Environmental — energy, water, waste, emissions" },
            { icon: Users, text: "Social — workers, wages, safety, fairness" },
            { icon: Shield, text: "Governance — transparency and business practices" },
        ],
        bottomNote: "This is how buyers decide if you are a reliable supplier.",
    },

    {
        id: 3,
        icon: FileText,
        iconBg: "#FFF8E1",
        iconColor: "#B8860B",
        title: "Why this is happening",
        subtitle: "Because large companies are under pressure",
        points: [
            { icon: Shield, text: "They need to report ESG under SEBI’s BRSR framework" },
            { icon: Factory, text: "They are now expected to check their suppliers too" },
            { icon: BarChart3, text: "So they are starting to ask MSMEs for data" },
        ],
        bottomNote: "If they need it — they will ask you for it.",
    },

    {
        id: 4,
        icon: AlertTriangle,
        iconBg: "#FFEBEE",
        iconColor: "#9B2226",
        title: "Here’s the real problem",
        subtitle: "Most MSMEs fail at this step",
        points: [
            { icon: Shield, text: "Data doesn’t match (electricity, production, etc.)" },
            { icon: BarChart3, text: "Numbers look unrealistic to buyers" },
            { icon: Factory, text: "Reports get rejected or ignored" },
        ],
        bottomNote: "Even correct data can look wrong if it’s not structured properly.",
    },

    {
        id: 5,
        icon: Factory,
        iconBg: "#FFF8E1",
        iconColor: "#D4A843",
        title: "The surprising part?",
        subtitle: "You already have everything needed",
        points: [
            { icon: Zap, text: "Electricity bill — already in your records" },
            { icon: Users, text: "Worker data — attendance & payroll" },
            { icon: Leaf, text: "Water & waste — daily operations" },
            { icon: Shield, text: "Safety — incidents you already track" },
        ],
        bottomNote: "You don’t need new systems — just the right way to use your data.",
    },

    {
        id: 6,
        icon: BarChart3,
        iconBg: "#E8F5E9",
        iconColor: "#1B4332",
        title: "This is where ESGVerify comes in",
        subtitle: "We turn your raw data into something buyers trust",
        points: [
            { icon: Globe2, text: "We convert your inputs into ESG KPIs automatically" },
            { icon: Shield, text: "We detect mistakes and risky data before buyers see it" },
            { icon: BarChart3, text: "We structure everything based on real ESG standards" },
            { icon: FileText, text: "You get a clean, professional report instantly" },
        ],
        bottomNote: "No ESG knowledge. No consultants. Just results.",
    },
];

export default function OnboardingPage() {
    const router = useRouter();
    const [currentSlide, setCurrentSlide] = useState(0);

    function handleNext() {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(currentSlide + 1);
        } else {
            router.push("/dashboard");
        }
    }

    function handlePrev() {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    }

    function handleSkip() {
        router.push("/dashboard");
    }

    var slide = slides[currentSlide];
    var SlideIcon = slide.icon;

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", background: "linear-gradient(135deg, #F5F1EB 0%, #E8F5E9 100%)", fontFamily: "var(--font-inter), system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
            <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB" }}>
                <div style={{ maxWidth: "800px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
                    </div>
                    <button onClick={handleSkip} style={{ fontSize: "16px", color: "#1B4332", background: "none", border: "none", cursor: "pointer" }}>
                        Skip Introduction →
                    </button>
                </div>
            </nav>

            <div style={{ flex: 1, display: "flex", flexDirection: "column", maxWidth: "700px", margin: "0 auto", padding: "32px 24px", width: "100%" }}>
                {/* Progress Dots */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "32px" }}>
                    {slides.map(function (s, i) {
                        return (
                            <button
                                key={i}
                                onClick={function () { setCurrentSlide(i); }}
                                style={{
                                    width: i === currentSlide ? "32px" : "10px",
                                    height: "10px",
                                    borderRadius: "5px",
                                    backgroundColor: i === currentSlide ? "#1B4332" : i < currentSlide ? "#2D6A4F" : "#D1D5DB",
                                    border: "none",
                                    cursor: "pointer",
                                    transition: "all 0.3s",
                                }}
                            />
                        );
                    })}
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentSlide}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ duration: 0.3 }}
                        style={{ flex: 1 }}
                    >
                        <div style={{ textAlign: "center", marginBottom: "28px" }}>
                            <div style={{
                                width: "64px", height: "64px", borderRadius: "16px",
                                backgroundColor: slide.iconBg, display: "flex", alignItems: "center",
                                justifyContent: "center", margin: "0 auto 16px",
                            }}>
                                <SlideIcon style={{ width: "28px", height: "28px", color: slide.iconColor }} />
                            </div>
                            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>{slide.title}</h1>
                            <p style={{ fontSize: "14px", color: "#6B7280" }}>{slide.subtitle}</p>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
                            {slide.points.map(function (point, i) {
                                var PointIcon = point.icon;
                                return (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 + i * 0.08 }}
                                        style={{
                                            backgroundColor: "white", borderRadius: "12px",
                                            border: "1px solid #E2E0DB", padding: "16px 18px",
                                            display: "flex", alignItems: "start", gap: "12px",
                                        }}
                                    >
                                        <div style={{
                                            width: "32px", height: "32px", borderRadius: "8px",
                                            backgroundColor: "#F5F1EB", display: "flex", alignItems: "center",
                                            justifyContent: "center", flexShrink: 0,
                                        }}>
                                            <PointIcon style={{ width: "16px", height: "16px", color: "#1B4332" }} />
                                        </div>
                                        <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.6 }}>{point.text}</p>
                                    </motion.div>
                                );
                            })}
                        </div>

                        <div style={{
                            backgroundColor: "#E8F5E9", borderRadius: "12px",
                            padding: "14px 18px", border: "1px solid #A7F3D0",
                        }}>
                            <p style={{ fontSize: "13px", color: "#065F46", lineHeight: 1.6 }}>
                                <strong>Remember:</strong> {slide.bottomNote}
                            </p>
                        </div>
                    </motion.div>
                </AnimatePresence>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "32px" }}>
                    <button
                        onClick={handlePrev}
                        disabled={currentSlide === 0}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            backgroundColor: currentSlide === 0 ? "#F3F2EE" : "white",
                            color: currentSlide === 0 ? "#D1D5DB" : "#6B7280",
                            padding: "12px 24px", borderRadius: "10px", fontSize: "14px",
                            fontWeight: 500, border: "1px solid #E2E0DB",
                            cursor: currentSlide === 0 ? "not-allowed" : "pointer",
                        }}
                    >
                        <ArrowLeft style={{ width: "16px", height: "16px" }} /> Previous
                    </button>

                    <span style={{ fontSize: "13px", color: "#9CA3AF" }}>
                        {currentSlide + 1} of {slides.length}
                    </span>

                    <button
                        onClick={handleNext}
                        style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            backgroundColor: currentSlide === slides.length - 1 ? "#D4A843" : "#1B4332",
                            color: currentSlide === slides.length - 1 ? "#1B4332" : "white",
                            padding: "12px 24px", borderRadius: "10px", fontSize: "14px",
                            fontWeight: 600, border: "none", cursor: "pointer",
                        }}
                    >
                        {currentSlide === slides.length - 1 ? "Start Assessment" : "Next"}
                        <ArrowRight style={{ width: "16px", height: "16px" }} />
                    </button>
                </div>
            </div>
        </div>
    );
}