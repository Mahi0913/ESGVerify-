"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
    Leaf, Plus, LogOut, ChevronRight, Clock, CheckCircle2,
    AlertTriangle, BarChart3, Shield, TrendingUp, FileText, Settings
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface User {
    id: number;
    email: string;
    name: string;
}

interface Assessment {
    id: number;
    status: string;
    current_step: number;
    overall_score: number;
    greenwash_risk: number;
    data_confidence: number;
    company_data: any;
    created_at: string;
    updated_at: string;
}

export default function DashboardPage() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [assessments, setAssessments] = useState<Assessment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
            router.push("/login");
            return;
        }

        setUser(JSON.parse(userData));
        fetchAssessments(token);
    }, [router]);

    const fetchAssessments = async (token: string) => {
        try {
            const res = await fetch(`${API}/api/assessments`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setAssessments(data.assessments || []);
            }
        } catch (err) {
            console.error("Failed to fetch assessments");
        }
        setLoading(false);
    };

    const createNewAssessment = async () => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API}/api/assessments`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                router.push(`/assess/company?id=${data.assessment_id}`);
            }
        } catch (err) {
            console.error("Failed to create assessment");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.push("/");
    };

    const getScoreColor = (score: number) => {
        if (score >= 70) return "#2D6A4F";
        if (score >= 40) return "#B8860B";
        return "#9B2226";
    };

    const getRiskLabel = (risk: number) => {
        if (risk < 35) return { text: "Low", color: "#2D6A4F" };
        if (risk < 65) return { text: "Medium", color: "#B8860B" };
        return { text: "High", color: "#9B2226" };
    };

    const getStepLabel = (step: number) => {
        const steps = ["", "Company Info", "Buyer Analysis", "Data Entry", "Verification", "Results"];
        return steps[step] || "Unknown";
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString("en-IN", {
            day: "numeric", month: "short", year: "numeric"
        });
    };

    // Stats from completed assessments
    const completed = assessments.filter(a => a.status === "completed");
    const avgScore = completed.length > 0
        ? Math.round(completed.reduce((sum, a) => sum + (a.overall_score || 0), 0) / completed.length)
        : 0;
    const bestScore = completed.length > 0
        ? Math.round(Math.max(...completed.map(a => a.overall_score || 0)))
        : 0;
    const inProgress = assessments.filter(a => a.status === "in_progress");

    if (loading) {
        return (
            <div style={{
                minHeight: "100vh", display: "flex", alignItems: "center",
                justifyContent: "center", backgroundColor: "#F5F1EB"
            }}>
                <div style={{ textAlign: "center" }}>
                    <Leaf style={{ width: "32px", height: "32px", color: "#1B4332", margin: "0 auto 12px" }} />
                    <p style={{ color: "#6B7280", fontSize: "14px" }}>Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            {/* ─── TOP NAV ─── */}
            <nav style={{
                backgroundColor: "white", borderBottom: "1px solid #E2E0DB",
                position: "sticky", top: 0, zIndex: 40
            }}>
                <div style={{
                    maxWidth: "1200px", margin: "0 auto", padding: "0 24px",
                    height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between"
                }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
                        <span style={{
                            fontSize: "18px", fontWeight: 700, color: "#1B4332",
                            fontFamily: "var(--font-heading), system-ui, sans-serif"
                        }}>ESGVerify</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <Link href="/settings" style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            fontSize: "13px", color: "#6B7280", textDecoration: "none"
                        }}>
                            <Settings style={{ width: "16px", height: "16px" }} />
                            Settings
                        </Link>
                        <button onClick={handleLogout} style={{
                            display: "flex", alignItems: "center", gap: "6px",
                            fontSize: "13px", color: "#6B7280", background: "none",
                            border: "none", cursor: "pointer"
                        }}>
                            <LogOut style={{ width: "16px", height: "16px" }} />
                            Logout
                        </button>
                    </div>
                </div>
            </nav>

            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "32px 24px" }}>
                {/* ─── WELCOME + NEW ASSESSMENT ─── */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{
                            fontSize: "28px", fontWeight: 700, color: "#1B4332",
                            fontFamily: "var(--font-heading), system-ui, sans-serif"
                        }}>
                            {assessments.length === 0
                                ? `Welcome, ${user?.name?.split(" ")[0]}! Let's get started.`
                                : `Welcome back, ${user?.name?.split(" ")[0]}`
                            }
                        </h1>
                        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "4px" }}>
                            {assessments.length === 0
                                ? "Create your first assessment — it takes about 10 minutes"
                                : completed.length === 0
                                    ? `You have ${inProgress.length} assessment${inProgress.length > 1 ? "s" : ""} in progress`
                                    : `You have ${completed.length} completed assessment${completed.length > 1 ? "s" : ""}`
                            }
                        </p>
                    </div>
                    <button onClick={createNewAssessment} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        backgroundColor: "#1B4332", color: "white", padding: "12px 24px",
                        borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                        border: "none", cursor: "pointer"
                    }}>
                        <Plus style={{ width: "18px", height: "18px" }} />
                        New Assessment
                    </button>
                </div>

                {/* ─── STATS CARDS ─── */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "32px" }}>
                    {[
                        { icon: BarChart3, label: "Total Assessments", value: assessments.length.toString(), color: "#1B4332" },
                        { icon: TrendingUp, label: "Average Score", value: avgScore ? `${avgScore}/100` : "—", color: "#2D6A4F" },
                        { icon: Shield, label: "Best Score", value: bestScore ? `${bestScore}/100` : "—", color: "#D4A843" },
                        { icon: Clock, label: "In Progress", value: inProgress.length.toString(), color: "#B8860B" },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: i * 0.08 }}
                            style={{
                                backgroundColor: "white", borderRadius: "14px", padding: "20px",
                                border: "1px solid #E2E0DB"
                            }}
                        >
                            <stat.icon style={{ width: "20px", height: "20px", color: stat.color, marginBottom: "12px" }} />
                            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1B4332" }}>{stat.value}</div>
                            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>{stat.label}</div>
                        </motion.div>
                    ))}
                </div>

                {/* ─── RESUME INCOMPLETE ─── */}
                {inProgress.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            backgroundColor: "#FEF9EE", borderRadius: "14px", padding: "20px",
                            border: "1px solid #F3D9A4", marginBottom: "32px",
                            display: "flex", alignItems: "center", justifyContent: "space-between"
                        }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <AlertTriangle style={{ width: "20px", height: "20px", color: "#B8860B" }} />
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>
                                    You have an incomplete assessment
                                </div>
                                <div style={{ fontSize: "13px", color: "#6B7280" }}>
                                    Step {inProgress[0].current_step} of 5 — {getStepLabel(inProgress[0].current_step)}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                const step = inProgress[0].current_step;
                                const stepRoutes = ["", "company", "buyer", "data", "verify", "results"];
                                router.push(`/assess/${stepRoutes[step]}?id=${inProgress[0].id}`);
                            }}
                            style={{
                                display: "flex", alignItems: "center", gap: "6px",
                                backgroundColor: "#D4A843", color: "#1B4332", padding: "10px 20px",
                                borderRadius: "8px", fontSize: "13px", fontWeight: 600,
                                border: "none", cursor: "pointer"
                            }}
                        >
                            Continue
                            <ChevronRight style={{ width: "16px", height: "16px" }} />
                        </button>
                    </motion.div>
                )}



                {/* ─── ASSESSMENTS LIST ─── */}
                <div>
                    <h2 style={{
                        fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "16px",
                        fontFamily: "var(--font-heading), system-ui, sans-serif"
                    }}>
                        {assessments.length > 0 ? "Your Assessments" : "No Assessments Yet"}
                    </h2>

                    {assessments.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{
                                backgroundColor: "white", borderRadius: "14px", padding: "48px",
                                border: "1px solid #E2E0DB", textAlign: "center"
                            }}
                        >
                            <FileText style={{ width: "40px", height: "40px", color: "#D1D5DB", margin: "0 auto 16px" }} />
                            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1B4332", marginBottom: "8px" }}>
                                Start your first assessment
                            </h3>
                            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
                                Enter your business numbers and get a BRSR compliance report in 10 minutes
                            </p>
                            <button onClick={createNewAssessment} style={{
                                display: "inline-flex", alignItems: "center", gap: "8px",
                                backgroundColor: "#1B4332", color: "white", padding: "12px 24px",
                                borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                                border: "none", cursor: "pointer"
                            }}>
                                <Plus style={{ width: "16px", height: "16px" }} />
                                New Assessment
                            </button>
                        </motion.div>
                    ) : (
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {assessments.map((a, i) => (
                                <motion.div
                                    key={a.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: i * 0.05 }}
                                    onClick={() => {
                                        if (a.status === "completed") {
                                            router.push(`/assess/results?id=${a.id}`);
                                        } else {
                                            const stepRoutes = ["", "company", "buyer", "data", "verify", "results"];
                                            router.push(`/assess/${stepRoutes[a.current_step]}?id=${a.id}`);
                                        }
                                    }}
                                    style={{
                                        backgroundColor: "white", borderRadius: "14px", padding: "20px",
                                        border: "1px solid #E2E0DB", cursor: "pointer",
                                        display: "flex", alignItems: "center", justifyContent: "space-between",
                                        transition: "box-shadow 0.2s, border-color 0.2s"
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.boxShadow = "0 4px 20px rgba(27,67,50,0.06)";
                                        e.currentTarget.style.borderColor = "rgba(45,106,79,0.3)";
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.boxShadow = "none";
                                        e.currentTarget.style.borderColor = "#E2E0DB";
                                    }}
                                >
                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        {/* Score circle */}
                                        <div style={{
                                            width: "52px", height: "52px", borderRadius: "50%",
                                            border: `3px solid ${a.status === "completed" ? getScoreColor(a.overall_score) : "#E2E0DB"}`,
                                            display: "flex", alignItems: "center", justifyContent: "center",
                                            backgroundColor: a.status === "completed" ? `${getScoreColor(a.overall_score)}10` : "#FAFAF7"
                                        }}>
                                            {a.status === "completed" ? (
                                                <span style={{
                                                    fontSize: "16px", fontWeight: 700,
                                                    color: getScoreColor(a.overall_score)
                                                }}>{Math.round(a.overall_score)}</span>
                                            ) : (
                                                <Clock style={{ width: "18px", height: "18px", color: "#9CA3AF" }} />
                                            )}
                                        </div>

                                        <div>
                                            <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B4332" }}>
                                                {a.company_data?.company_name || a.company_data?.name || `Assessment #${a.id}`}
                                            </div>
                                            <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "flex", gap: "12px" }}>
                                                <span>{formatDate(a.created_at)}</span>
                                                {a.company_data?.industry && <span>• {a.company_data.industry}</span>}
                                                {a.company_data?.buyer_name && <span>• {a.company_data.buyer_name}</span>}
                                            </div>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                                        {a.status === "completed" ? (
                                            <>
                                                <div style={{ textAlign: "right" }}>
                                                    <div style={{
                                                        fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
                                                        color: getRiskLabel(a.greenwash_risk).color,
                                                        letterSpacing: "0.5px"
                                                    }}>
                                                        {getRiskLabel(a.greenwash_risk).text} Risk
                                                    </div>
                                                    <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                                                        Confidence: {Math.round(a.data_confidence)}%
                                                    </div>
                                                </div>
                                                <CheckCircle2 style={{ width: "20px", height: "20px", color: "#2D6A4F" }} />
                                            </>
                                        ) : (
                                            <div style={{
                                                fontSize: "12px", color: "#B8860B", fontWeight: 500,
                                                backgroundColor: "#FEF9EE", padding: "4px 12px", borderRadius: "6px"
                                            }}>
                                                Step {a.current_step}/5
                                            </div>
                                        )}
                                        <ChevronRight style={{ width: "18px", height: "18px", color: "#9CA3AF" }} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}