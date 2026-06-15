"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Leaf, ArrowLeft, BarChart3, Brain, TrendingUp, TrendingDown, Info,
  CheckCircle2, AlertTriangle, XCircle,
} from "lucide-react";

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

function getTier(score: number) {
  if (score >= 70) return "Strong";
  if (score >= 40) return "Moderate";
  return "Weak";
}

export default function ESGScorePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [expandedKpi, setExpandedKpi] = useState<number | null>(null);

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
        setKpis(a.kpis || []);
        setOverall(a.fuzzy_data?.overall || null);
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Brain style={{ width: "40px", height: "40px", color: "#1B4332" }} />
        </motion.div>
        <p style={{ fontSize: "16px", color: "#1B4332", marginTop: "20px", fontWeight: 600 }}>Loading ESG Score...</p>
      </div>
    );
  }

  var esgScore = overall?.score || 0;
  var pillarScores = overall?.pillar_scores || {};
  var E = pillarScores.Environmental || 0;
  var S = pillarScores.Social || 0;
  var G = pillarScores.Governance || 0;
  var scoreColor = getScoreColor(esgScore);
  var scoreBg = getScoreBg(esgScore);
  var improvableKpis = kpis.filter(function (k) { return (k.score || 0) < 70; });

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
            <BarChart3 style={{ width: "18px", height: "18px", color: "#1B4332" }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>ESG Score Detail</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>
            {assessment?.company_data?.company_name || "Your Company"}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
            BRSR Core weighted score · SEBI methodology
          </p>
        </motion.div>

        {/* Big Score Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ backgroundColor: scoreBg, borderRadius: "20px", padding: "36px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "40px" }}>
            <div style={{ textAlign: "center", minWidth: "140px" }}>
              <div style={{ fontSize: "80px", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{Math.round(esgScore)}</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: scoreColor, marginTop: "4px" }}>ESG Score</div>
              <div style={{ fontSize: "14px", color: scoreColor, opacity: 0.75, marginTop: "4px" }}>{getTier(esgScore)} Performance</div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7, marginBottom: "16px" }}>
                {esgScore >= 70
                  ? "Your company demonstrates strong ESG practices across environmental, social, and governance pillars. This score reflects well-managed sustainability metrics aligned with BRSR Core requirements."
                  : esgScore >= 40
                    ? "Your company shows moderate ESG performance with room for improvement. Several KPIs are on track, but key areas need attention to meet buyer and regulatory expectations."
                    : "Your ESG score indicates significant gaps in sustainability reporting and practices. Focused action on the KPIs below can substantially improve your score."}
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { label: "KPIs Measured", value: kpis.length },
                  { label: "Above 70", value: kpis.filter(k => (k.score || 0) >= 70).length },
                  { label: "Need Improvement", value: improvableKpis.length },
                ].map(function (stat, i) {
                  return (
                    <div key={i} style={{ backgroundColor: "white", borderRadius: "10px", padding: "12px 20px", textAlign: "center" }}>
                      <div style={{ fontSize: "22px", fontWeight: 800, color: "#1B4332" }}>{stat.value}</div>
                      <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "2px" }}>{stat.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pillar Breakdown */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>Pillar Breakdown</h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>How each pillar contributes to your final ESG score</p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "24px" }}>
              {[
                { label: "Environmental", weight: 0.55, score: E, color: "#2D6A4F", bg: "#E8F5E9", kpiRange: "KPI 1–5" },
                { label: "Social", weight: 0.30, score: S, color: "#B8860B", bg: "#FFF8E1", kpiRange: "KPI 6–8" },
                { label: "Governance", weight: 0.15, score: G, color: "#1B4332", bg: "#E0F2F1", kpiRange: "KPI 9" },
              ].map(function (p, i) {
                return (
                  <div key={i} style={{ backgroundColor: p.bg, borderRadius: "14px", padding: "20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "13px", fontWeight: 700, color: p.color }}>{p.label}</span>
                      <span style={{ fontSize: "12px", color: p.color, opacity: 0.75, fontWeight: 600 }}>{(p.weight * 100).toFixed(0)}% weight</span>
                    </div>
                    <div style={{ fontSize: "44px", fontWeight: 800, color: p.color, lineHeight: 1, marginBottom: "4px" }}>{Math.round(p.score)}</div>
                    <div style={{ fontSize: "12px", color: p.color, opacity: 0.7, marginBottom: "12px" }}>
                      Contributes <strong>{Math.round(p.score * p.weight)}</strong> pts · {p.kpiRange}
                    </div>
                    <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(0,0,0,0.08)", borderRadius: "3px" }}>
                      <div style={{ width: p.score + "%", height: "100%", backgroundColor: p.color, borderRadius: "3px", transition: "width 1s ease-out" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formula */}
            <div style={{ backgroundColor: "#FAFAF7", borderRadius: "12px", padding: "20px", border: "1px solid #E2E0DB" }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B4332", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info style={{ width: "14px", height: "14px" }} /> Formula (SEBI BRSR Core)
              </div>
              <div style={{ fontSize: "15px", color: "#374151", fontFamily: "monospace", lineHeight: 2 }}>
                <span style={{ color: "#2D6A4F", fontWeight: 700 }}>E</span> × 0.55 +{" "}
                <span style={{ color: "#B8860B", fontWeight: 700 }}>S</span> × 0.30 +{" "}
                <span style={{ color: "#1B4332", fontWeight: 700 }}>G</span> × 0.15 = <strong>ESG Score</strong>
              </div>
              <div style={{ fontSize: "14px", color: "#6B7280", marginTop: "8px" }}>
                ({Math.round(E)} × 0.55) + ({Math.round(S)} × 0.30) + ({Math.round(G)} × 0.15) ={" "}
                <strong style={{ color: "#1B4332" }}>{Math.round(esgScore)}</strong>
              </div>
              {overall?.penalty > 0 && (
                <div style={{ marginTop: "10px", color: "#9B2226", fontSize: "13px" }}>
                  <strong>Penalty applied:</strong> −{overall.penalty} pts for {overall.critical_gaps?.length || 0} KPI(s) scoring below 30
                </div>
              )}
              <div style={{ marginTop: "10px", fontSize: "12px", color: "#9CA3AF" }}>
                Weights derived from SEBI BRSR Core framework: 5 Environmental, 3 Social, 1 Governance KPI
              </div>
            </div>
          </div>
        </motion.div>

        {/* 9 KPI Cards */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>9 BRSR Core KPIs</h2>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px" }}>Click any KPI to see the full scoring reasoning and formula</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "14px", marginBottom: "28px" }}>
            {kpis.map(function (kpi, i) {
              var score = kpi.score || 0;
              var color = getScoreColor(score);
              var bg = getScoreBg(score);
              var isOpen = expandedKpi === i;
              var fuzzy = kpi.fuzzy || {};

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", overflow: "hidden", cursor: "pointer" }}
                  onClick={function () { setExpandedKpi(isOpen ? null : i); }}
                >
                  {/* Header */}
                  <div style={{ backgroundColor: bg, padding: "16px 18px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ flex: 1, paddingRight: "12px" }}>
                      <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "2px" }}>KPI {kpi.kpi_number || i + 1}</div>
                      <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B4332" }}>{kpi.kpi_name || "KPI"}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "30px", fontWeight: 800, color: color }}>{score}</div>
                      <div style={{ fontSize: "11px", color: color, fontWeight: 600 }}>{getTier(score)}</div>
                    </div>
                  </div>

                  {/* Bar */}
                  <div style={{ height: "4px", backgroundColor: "#F3F2EE" }}>
                    <div style={{ width: score + "%", height: "100%", backgroundColor: color }} />
                  </div>

                  {/* Summary */}
                  <div style={{ padding: "14px 18px" }}>
                    {kpi.display_value && (
                      <div style={{ fontSize: "13px", color: "#6B7280", marginBottom: "6px" }}>
                        <strong>Value:</strong> {kpi.display_value} {kpi.unit}
                      </div>
                    )}
                    {fuzzy.explanation && (
                      <div style={{ fontSize: "12px", color: "#9CA3AF", lineHeight: 1.5, marginBottom: "8px" }}>{fuzzy.explanation}</div>
                    )}
                    <div style={{ fontSize: "11px", color: color, fontWeight: 600 }}>
                      {isOpen ? "▲ Less detail" : "▼ More detail"}
                    </div>
                  </div>

                  {/* Expanded Detail */}
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{ borderTop: "1px solid #E2E0DB", padding: "16px 18px", backgroundColor: "#FAFAF7" }}
                    >
                      {kpi.score_reasoning && (
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Scoring Reasoning</div>
                          <div style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6 }}>{kpi.score_reasoning}</div>
                        </div>
                      )}
                      {kpi.formula && (
                        <div style={{ marginBottom: "12px" }}>
                          <div style={{ fontSize: "11px", fontWeight: 700, color: "#1B4332", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "4px" }}>Formula</div>
                          <div style={{ fontSize: "13px", color: "#374151", fontFamily: "monospace", backgroundColor: "white", padding: "8px 12px", borderRadius: "8px", border: "1px solid #E2E0DB" }}>{kpi.formula}</div>
                        </div>
                      )}

                      {!kpi.score_reasoning && !kpi.formula && (
                        <div style={{ fontSize: "13px", color: "#9CA3AF" }}>
                          Score: {score}/100 · Tier: {getTier(score)} · {fuzzy.explanation || "Fuzzy logic score based on reported data"}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Areas to Improve */}
        {improvableKpis.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                <TrendingUp style={{ width: "18px", height: "18px", color: "#D4A843" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>Areas to Improve</h2>
              </div>
              <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
                These {improvableKpis.length} KPIs are below 70 and have the most impact on your ESG score.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {improvableKpis.map(function (kpi, i) {
                  var score = kpi.score || 0;
                  var color = getScoreColor(score);
                  var gap = 70 - score;
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", backgroundColor: "#FAFAF7", borderRadius: "12px", border: "1px solid #E2E0DB" }}>
                      <div style={{ minWidth: "52px", textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: 800, color: color }}>{score}</div>
                        <div style={{ fontSize: "11px", color: color, fontWeight: 600 }}>{getTier(score)}</div>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>{kpi.kpi_name}</div>
                        <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: 1.5 }}>
                          {kpi.kpi_name === "GHG Footprint" && "Reduce emissions by switching to solar energy or low-emission fuels. Replace diesel with natural gas where possible."}
                          {kpi.kpi_name === "Energy Footprint" && "Conduct an energy audit. Install LED lighting, optimize motor loads, and consider rooftop solar (5-10 kW)."}
                          {kpi.kpi_name === "Water Footprint" && "Install a basic ETP/STP for water recycling. Target 30% recycling rate to meet buyer expectations."}
                          {kpi.kpi_name === "Waste Management" && "Switch to an authorized recycler with certificate. Implement waste segregation at source."}
                          {kpi.kpi_name === "Gender Diversity" && "Initiate targeted women hiring. Consider adding creche facility if required by workforce size."}
                          {kpi.kpi_name === "Wage Parity" && "Review lowest wages against state minimum. Ensure all workers receive at least the state-mandated minimum wage."}
                          {kpi.kpi_name === "Occupational Safety (LTIFR)" && "Start monthly safety training. Document all incidents including minor ones. Provide PPE to all workers."}
                          {kpi.kpi_name === "Governance — Complaint Resolution" && "Set up a formal complaint register. Track and resolve complaints within 30 days."}
                          {kpi.kpi_name === "Circularity" && "Reduce waste-to-input ratio. Explore recycled raw materials and optimize production yield."}
                        </div>
                        {kpi.display_value && (
                          <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Current: {kpi.display_value}</div>
                        )}
                      </div>
                      <div style={{ width: "80px" }}>
                        <div style={{ width: "100%", height: "6px", backgroundColor: "#F3F2EE", borderRadius: "3px" }}>
                          <div style={{ width: score + "%", height: "100%", backgroundColor: color, borderRadius: "3px" }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

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
