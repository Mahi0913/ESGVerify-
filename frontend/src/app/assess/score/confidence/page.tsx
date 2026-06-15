"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowLeft, Target, CheckCircle2, AlertTriangle, XCircle, Info, Filter } from "lucide-react";

const API = "http://localhost:8000";

function getScoreColor(score: number) {
  if (score >= 70) return "#2D6A4F";
  if (score >= 40) return "#B8860B";
  return "#9B2226";
}

function getScoreBg(score: number) {
  if (score >= 70) return "#E8F5E9";
  if (score >= 40) return "#FFF8E1";
  return "#FFEBEE";
}

function getScoreLabel(score: number) {
  if (score >= 70) return "Reliable Data";
  if (score >= 40) return "Some Concerns";
  return "Review Needed";
}

function getStatusColor(status: string) {
  if (status === "pass") return "#2D6A4F";
  if (status === "warn") return "#B8860B";
  return "#9B2226";
}

function getStatusBg(status: string) {
  if (status === "pass") return "#E8F5E9";
  if (status === "warn") return "#FFF8E1";
  return "#FFEBEE";
}

function StatusIcon({ status }: { status: string }) {
  if (status === "pass") return <CheckCircle2 style={{ width: "16px", height: "16px", color: "#2D6A4F", flexShrink: 0 }} />;
  if (status === "warn") return <AlertTriangle style={{ width: "16px", height: "16px", color: "#B8860B", flexShrink: 0 }} />;
  return <XCircle style={{ width: "16px", height: "16px", color: "#9B2226", flexShrink: 0 }} />;
}

export default function ConfidencePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [checks, setChecks] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "pass" | "warn" | "fail">("all");

  useEffect(function () {
    if (!assessmentId) return;
    var token = localStorage.getItem("token");
    if (!token) return;

    fetch(API + "/api/assessments/" + assessmentId, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        var a = data.assessment;
        if (!a) return;
        setAssessment(a);
        setConfidence(a.fuzzy_data?.confidence || null);
        setChecks(a.verification_checks || []);
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Target style={{ width: "40px", height: "40px", color: "#1B4332" }} />
        </motion.div>
        <p style={{ fontSize: "16px", color: "#1B4332", marginTop: "20px", fontWeight: 600 }}>Loading Confidence Analysis...</p>
      </div>
    );
  }

  var confScore = typeof confidence === "number" ? confidence : (confidence?.score || 0);
  var confExplanation = typeof confidence === "object" ? confidence?.explanation : null;
  var scoreColor = getScoreColor(confScore);
  var scoreBg = getScoreBg(confScore);

  var passed = checks.filter(function (c) { return c.status === "pass"; });
  var warned = checks.filter(function (c) { return c.status === "warn"; });
  var failed = checks.filter(function (c) { return c.status === "fail"; });

  var filteredChecks = filter === "all" ? checks
    : filter === "pass" ? passed
      : filter === "warn" ? warned
        : failed;

  var categories = Array.from(new Set(checks.map(function (c) { return c.category || "General"; })));

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <button
            onClick={function () { router.push("/assess/results?id=" + assessmentId); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "transparent", border: "1px solid #E2E0DB", color: "#6B7280", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} /> Back to Results
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Target style={{ width: "18px", height: "18px", color: scoreColor }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: scoreColor }}>Data Confidence Detail</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>
            {assessment?.company_data?.company_name || "Your Company"}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
            {checks.length} verification checks · Internal consistency analysis
          </p>
        </motion.div>

        {/* Big Score Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ backgroundColor: scoreBg, borderRadius: "20px", padding: "36px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "40px" }}>
            <div style={{ textAlign: "center", minWidth: "140px" }}>
              <div style={{ fontSize: "80px", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{Math.round(confScore)}</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: scoreColor, marginTop: "4px" }}>Confidence</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: scoreColor, marginTop: "6px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "20px", padding: "4px 14px", display: "inline-block" }}>
                {getScoreLabel(confScore)}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", color: "#4B5563", lineHeight: 1.7, marginBottom: "16px" }}>
                {confExplanation || (confScore >= 70
                  ? "Your data is internally consistent and reliable. The reported figures align well across sections, suggesting accurate and well-maintained records."
                  : confScore >= 40
                    ? "Most of your data is consistent, but some checks flagged potential issues. Review the warnings below and correct any inconsistencies."
                    : "Several data checks failed. The numbers reported show inconsistencies that may indicate incomplete records or data entry errors.")}
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { label: "Passed", value: passed.length, color: "#2D6A4F", bg: "#E8F5E9" },
                  { label: "Warnings", value: warned.length, color: "#B8860B", bg: "#FFF8E1" },
                  { label: "Failed", value: failed.length, color: "#9B2226", bg: "#FFEBEE" },
                ].map(function (stat, i) {
                  return (
                    <div key={i} style={{ backgroundColor: stat.bg, borderRadius: "10px", padding: "12px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: "12px", color: stat.color, marginTop: "2px", fontWeight: 600 }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Methodology */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Info style={{ width: "16px", height: "16px", color: "#D4A843" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1B4332" }}>How Data Confidence is Calculated</h2>
            </div>
            <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7 }}>
              Data Confidence measures how internally consistent and complete your reported ESG data is.
              We run <strong>{checks.length} automated checks</strong> across your data: range validation, cross-field consistency,
              completeness, and reasonableness tests. Each check is weighted by category criticality.
              Passing all checks gives 100; failures and warnings reduce the score.
            </div>
            <div style={{ display: "flex", gap: "16px", marginTop: "14px", flexWrap: "wrap" }}>
              {[
                { label: "Pass = full points", color: "#2D6A4F", bg: "#E8F5E9" },
                { label: "Warn = partial penalty", color: "#B8860B", bg: "#FFF8E1" },
                { label: "Fail = full penalty", color: "#9B2226", bg: "#FFEBEE" },
              ].map(function (item, i) {
                return (
                  <div key={i} style={{ backgroundColor: item.bg, color: item.color, fontSize: "12px", fontWeight: 600, padding: "6px 14px", borderRadius: "20px" }}>
                    {item.label}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Category Summary */}
        {categories.length > 1 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "24px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "16px" }}>By Category</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                {categories.map(function (cat, i) {
                  var catChecks = checks.filter(function (c) { return (c.category || "General") === cat; });
                  var catPassed = catChecks.filter(function (c) { return c.status === "pass"; }).length;
                  var catFailed = catChecks.filter(function (c) { return c.status === "fail"; }).length;
                  var catScore = catChecks.length > 0 ? Math.round((catPassed / catChecks.length) * 100) : 0;
                  return (
                    <div key={i} style={{ backgroundColor: "#FAFAF7", borderRadius: "12px", padding: "16px", border: "1px solid #E2E0DB" }}>
                      <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B4332", marginBottom: "8px" }}>{cat}</div>
                      <div style={{ fontSize: "28px", fontWeight: 800, color: getScoreColor(catScore), marginBottom: "4px" }}>{catScore}%</div>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>{catPassed}/{catChecks.length} passed</div>
                      {catFailed > 0 && (
                        <div style={{ fontSize: "11px", color: "#9B2226", marginTop: "4px", fontWeight: 600 }}>{catFailed} failed</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Filter + Checks */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "2px" }}>All {checks.length} Verification Checks</h2>
                <p style={{ fontSize: "14px", color: "#6B7280" }}>Showing {filteredChecks.length} checks</p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                {(["all", "pass", "warn", "fail"] as const).map(function (f) {
                  var count = f === "all" ? checks.length : f === "pass" ? passed.length : f === "warn" ? warned.length : failed.length;
                  return (
                    <button
                      key={f}
                      onClick={function () { setFilter(f); }}
                      style={{
                        padding: "6px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: 600, border: "none", cursor: "pointer",
                        backgroundColor: filter === f ? "#1B4332" : "#F3F2EE",
                        color: filter === f ? "white" : "#6B7280",
                        textTransform: "capitalize",
                      }}
                    >
                      {f === "all" ? "All" : f} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {filteredChecks.length === 0 ? (
                <div style={{ fontSize: "14px", color: "#9CA3AF", textAlign: "center", padding: "32px" }}>No checks in this category</div>
              ) : (
                filteredChecks.map(function (check, i) {
                  var status = check.status || "pass";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.03 }}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "12px",
                        padding: "16px", backgroundColor: "#FAFAF7", borderRadius: "12px",
                        border: "1px solid #E2E0DB",
                      }}
                    >
                      <div style={{ marginTop: "2px" }}>
                        <StatusIcon status={status} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: "#1B4332" }}>{check.title || "Check " + (i + 1)}</span>
                          {check.category && (
                            <span style={{ fontSize: "11px", color: "#9CA3AF", backgroundColor: "#EEE", padding: "2px 8px", borderRadius: "10px" }}>
                              {check.category}
                            </span>
                          )}
                          <span style={{
                            fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "10px",
                            backgroundColor: getStatusBg(status), color: getStatusColor(status),
                          }}>
                            {status === "pass" ? "Passed" : status === "warn" ? "Warning" : "Failed"}
                          </span>
                        </div>
                        {check.message && (
                          <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{check.message}</p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>

        {/* Back */}
        <button
          onClick={function () { router.push("/assess/results?id=" + assessmentId); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1B4332", color: "white", padding: "14px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 600, border: "none", cursor: "pointer", marginBottom: "40px" }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} /> Back to Results
        </button>
      </div>
    </div>
  );
}
