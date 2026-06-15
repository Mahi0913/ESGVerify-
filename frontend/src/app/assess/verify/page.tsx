"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, XCircle, Shield, ChevronDown, ChevronUp } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function VerifyPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const assessmentId = searchParams.get("id");

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checks, setChecks] = useState<any[]>([]);
    const [confidence, setConfidence] = useState<any>(null);
    const [expandedCheck, setExpandedCheck] = useState<number | null>(null);

    useEffect(function () {
        if (!assessmentId) return;
        var token = localStorage.getItem("token");
        if (!token) return;

        fetch(API + "/api/assessments/" + assessmentId, {
            headers: { Authorization: "Bearer " + token },
        })
            .then(function (res) { return res.json(); })
            .then(async function (data) {
                var assessment = data.assessment;
                if (!assessment) return;

                if (assessment.verification_checks && assessment.verification_checks.length > 0) {
                    setChecks(assessment.verification_checks);
                    setConfidence(assessment.fuzzy_data?.confidence || null);
                    setLoading(false);
                    return;
                }

                var answers = assessment.answers || {};
                var cd = assessment.company_data || {};

                var verifyData = Object.assign({}, cd);
                Object.keys(answers).forEach(function (key) {
                    var val = answers[key];
                    if (val === "" || val === null || val === undefined) return;
                    var numVal = Number(val);
                    if (!isNaN(numVal) && val !== "") {
                        verifyData[key] = numVal;
                    } else {
                        verifyData[key] = val;
                    }
                });

                if (cd.state) verifyData.state = cd.state;
                if (cd.industry) verifyData.industry = cd.industry;
                if (cd.buyer_name) verifyData.buyer_name = cd.buyer_name;
                if (cd.gstin) verifyData.gstin = cd.gstin;

                try {
                    var verifyRes = await fetch(API + "/api/verify-data", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ data: verifyData }),
                    });
                    var verifyResult = await verifyRes.json();
                    setChecks(verifyResult.checks || []);
                    setConfidence(verifyResult.confidence || null);

                    await fetch(API + "/api/assessments/" + assessmentId, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                        body: JSON.stringify({
                            verification_checks: verifyResult.checks || [],
                            fuzzy_data: { confidence: verifyResult.confidence },
                        }),
                    });
                } catch (err) {
                    console.error("Verification failed");
                }
                setLoading(false);
            })
            .catch(function () { setLoading(false); });
    }, [assessmentId]);

    var passCount = 0;
    var warnCount = 0;
    var failCount = 0;
    checks.forEach(function (c) {
        if (c.status === "pass") passCount++;
        else if (c.status === "warn") warnCount++;
        else failCount++;
    });

    function getStatusColor(status: string) {
        if (status === "pass") return "#2D6A4F";
        if (status === "warn") return "#B8860B";
        return "#9B2226";
    }

    function getStatusBg(status: string) {
        if (status === "pass") return "#ECFDF5";
        if (status === "warn") return "#FEF9EE";
        return "#FEF2F2";
    }

    function getStatusBorder(status: string) {
        if (status === "pass") return "#A7F3D0";
        if (status === "warn") return "#F3D9A4";
        return "#FECACA";
    }

    function getStatusLabel(status: string) {
        if (status === "pass") return "Passed";
        if (status === "warn") return "Warning";
        return "Failed";
    }

    function getStatusIcon(status: string) {
        if (status === "pass") return CheckCircle2;
        if (status === "warn") return AlertTriangle;
        return XCircle;
    }

    function getConfidenceValue() {
        if (typeof confidence === "number") return confidence;
        if (confidence && confidence.score) return confidence.score;
        return 0;
    }

    async function handleNext() {
        setSaving(true);
        var token = localStorage.getItem("token");
        try {
            await fetch(API + "/api/assessments/" + assessmentId, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
                body: JSON.stringify({ step: 5 }),
            });
            router.push("/assess/results?id=" + assessmentId);
        } catch (err) {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
                <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
                    <Shield style={{ width: "24px", height: "24px", color: "white" }} />
                </div>
                <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1B4332", marginBottom: "8px" }}>Running 17 verification checks...</h2>
                <p style={{ fontSize: "14px", color: "#6B7280" }}>Cross-checking your data against industry benchmarks</p>
                <Loader2 style={{ width: "24px", height: "24px", color: "#2D6A4F", animation: "spin 1s linear infinite", marginTop: "16px" }} />
                <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
            </div>
        );
    }

    var confValue = getConfidenceValue();

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
                    </div>
                    <button onClick={function () { router.push("/assess/data?id=" + assessmentId); }} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <ArrowLeft style={{ width: "16px", height: "16px" }} /> Edit Data
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
                {/* Step Progress */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                    {["Company", "Buyer", "Data Entry", "Verify", "Results"].map(function (step, i) {
                        return (
                            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flex: i < 4 ? 1 : undefined }}>
                                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: i <= 3 ? "#1B4332" : "#E2E0DB", color: i <= 3 ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, flexShrink: 0 }}>
                                    {i < 3 ? "\u2713" : i + 1}
                                </div>
                                <span style={{ fontSize: "12px", color: i <= 3 ? "#1B4332" : "#9CA3AF", fontWeight: i === 3 ? 600 : 400 }}>{step}</span>
                                {i < 4 && <div style={{ flex: 1, height: "2px", backgroundColor: i < 3 ? "#1B4332" : "#E2E0DB" }} />}
                            </div>
                        );
                    })}
                </div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>Data Verification</h1>
                    <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
                        {checks.length} automated checks verified your data against industry benchmarks and regulatory requirements.
                    </p>
                </motion.div>

                {/* Summary Cards */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "12px", marginBottom: "24px" }}>
                    {[
                        { label: "Passed", count: passCount, color: "#2D6A4F", bg: "#ECFDF5", border: "#A7F3D0", Icon: CheckCircle2 },
                        { label: "Warnings", count: warnCount, color: "#B8860B", bg: "#FEF9EE", border: "#F3D9A4", Icon: AlertTriangle },
                        { label: "Failed", count: failCount, color: "#9B2226", bg: "#FEF2F2", border: "#FECACA", Icon: XCircle },
                    ].map(function (item, i) {
                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.08 }}
                                style={{ backgroundColor: item.bg, borderRadius: "12px", border: "1px solid " + item.border, padding: "20px", textAlign: "center" }}
                            >
                                <item.Icon style={{ width: "20px", height: "20px", color: item.color, margin: "0 auto 8px", display: "block" }} />
                                <div style={{ fontSize: "28px", fontWeight: 700, color: item.color }}>{item.count}</div>
                                <div style={{ fontSize: "12px", color: item.color, fontWeight: 500 }}>{item.label}</div>
                            </motion.div>
                        );
                    })}
                </div>

                {/* Confidence Score */}
                {confidence && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px", marginBottom: "24px" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <Shield style={{ width: "18px", height: "18px", color: "#1B4332" }} />
                                <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>Data Confidence Score</span>
                            </div>
                            <span style={{ fontSize: "20px", fontWeight: 700, color: confValue >= 70 ? "#2D6A4F" : confValue >= 40 ? "#B8860B" : "#9B2226" }}>
                                {Math.round(confValue)}/100
                            </span>
                        </div>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E0DB", borderRadius: "4px", overflow: "hidden" }}>
                            <div style={{
                                width: confValue + "%",
                                height: "100%",
                                backgroundColor: confValue >= 70 ? "#2D6A4F" : confValue >= 40 ? "#B8860B" : "#9B2226",
                                borderRadius: "4px",
                                transition: "width 0.5s",
                            }} />
                        </div>
                        <p style={{ fontSize: "12px", color: "#6B7280", marginTop: "8px" }}>
                            {confValue >= 70
                                ? "Your data appears reliable and internally consistent."
                                : confValue >= 40
                                    ? "Some inconsistencies detected. Review the warnings below."
                                    : "Significant data issues found. Please review and fix the flagged items."}
                        </p>
                    </motion.div>
                )}

                {/* Individual Checks */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {checks.map(function (check, i) {
                        var StatusIcon = getStatusIcon(check.status);
                        var isExpanded = expandedCheck === i;

                        return (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.03 }}
                                style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E0DB", overflow: "hidden" }}
                            >
                                <button
                                    onClick={function () { setExpandedCheck(isExpanded ? null : i); }}
                                    style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                                >
                                    <div style={{ width: "4px", height: "32px", borderRadius: "2px", backgroundColor: getStatusColor(check.status), flexShrink: 0 }} />
                                    <StatusIcon style={{ width: "18px", height: "18px", color: getStatusColor(check.status), flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>{check.title}</div>
                                        {check.category && (
                                            <span style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{check.category}</span>
                                        )}
                                    </div>
                                    <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "6px", backgroundColor: getStatusBg(check.status), color: getStatusColor(check.status) }}>
                                        {getStatusLabel(check.status)}
                                    </span>
                                    {isExpanded
                                        ? <ChevronUp style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />
                                        : <ChevronDown style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />
                                    }
                                </button>

                                {isExpanded && (
                                    <div style={{ padding: "0 16px 14px 48px", fontSize: "13px", color: "#4B5563", lineHeight: 1.6 }}>
                                        {check.message}
                                    </div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>

                {/* Fix Data Warning */}
                {(warnCount > 0 || failCount > 0) && (
                    <div style={{ marginTop: "16px", padding: "12px 16px", borderRadius: "10px", backgroundColor: "#FEF9EE", border: "1px solid #F3D9A4", fontSize: "13px", color: "#92400E", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span>Found issues? You can go back and fix your data.</span>
                        <button
                            onClick={function () { router.push("/assess/data?id=" + assessmentId); }}
                            style={{ fontSize: "13px", fontWeight: 600, color: "#B8860B", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
                        >
                            Edit Data
                        </button>
                    </div>
                )}

                {/* Navigation */}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
                    <button onClick={function () { router.push("/assess/data?id=" + assessmentId); }} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        backgroundColor: "white", color: "#6B7280", padding: "14px 24px",
                        borderRadius: "10px", fontSize: "14px", fontWeight: 500,
                        border: "1px solid #E2E0DB", cursor: "pointer",
                    }}>
                        <ArrowLeft style={{ width: "16px", height: "16px" }} /> Back to Data
                    </button>
                    <button onClick={handleNext} disabled={saving} style={{
                        display: "flex", alignItems: "center", gap: "8px",
                        backgroundColor: "#1B4332", color: "white", padding: "14px 32px",
                        borderRadius: "10px", fontSize: "15px", fontWeight: 600,
                        border: "none", cursor: saving ? "wait" : "pointer",
                    }}>
                        {saving ? "Loading Results..." : "View Results"}
                        {!saving && <ArrowRight style={{ width: "18px", height: "18px" }} />}
                    </button>
                </div>
            </div>
        </div>
    );
}