"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowLeft, TrendingUp, CheckCircle2, AlertTriangle, XCircle, Info, Building2, Target } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

function getReadinessLabel(score: number) {
  if (score >= 70) return "Ready to Supply";
  if (score >= 40) return "Partially Ready";
  return "Needs Work";
}

function getStatusIcon(status: string) {
  if (status === "met") return { icon: CheckCircle2, color: "#2D6A4F", bg: "#E8F5E9", label: "Met" };
  if (status === "borderline") return { icon: AlertTriangle, color: "#B8860B", bg: "#FFF8E1", label: "Borderline" };
  return { icon: XCircle, color: "#9B2226", bg: "#FFEBEE", label: "Gap" };
}

export default function BuyerReadinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);

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
        setGapAnalysis(a.gap_analysis || null);
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <TrendingUp style={{ width: "40px", height: "40px", color: "#1B4332" }} />
        </motion.div>
        <p style={{ fontSize: "16px", color: "#1B4332", marginTop: "20px", fontWeight: 600 }}>Loading Buyer Readiness...</p>
      </div>
    );
  }

  // Use the REAL readiness score from gap analysis (computed by AI in results page)
  var readinessScore = gapAnalysis?.readiness_score || 0;
  var scoreColor = getScoreColor(readinessScore);
  var scoreBg = getScoreBg(readinessScore);
  var buyerName = assessment?.company_data?.buyer_name || "Buyer";
  var companyName = assessment?.company_data?.company_name || "Your Company";
  var buyerSummary = assessment?.buyer_summary || null;

  // Gap analysis data from AI
  var gaps = gapAnalysis?.gaps || [];
  var buyerPriorities = gapAnalysis?.buyer_priorities || [];
  var gapSummary = gapAnalysis?.summary || "";
  var industryRelevant = gapAnalysis?.industry_relevant;
  var industryNote = gapAnalysis?.industry_note || "";

  // Categorize gaps
  var metGaps = gaps.filter(function (g: any) { return g.status === "met"; });
  var borderlineGaps = gaps.filter(function (g: any) { return g.status === "borderline"; });
  var gapGaps = gaps.filter(function (g: any) { return g.status === "gap"; });

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
            <TrendingUp style={{ width: "18px", height: "18px", color: scoreColor }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: scoreColor }}>Buyer Readiness Detail</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>
            {companyName}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
            ESG alignment with <strong>{buyerName}</strong> · Supply chain readiness
          </p>
        </motion.div>

        {/* Big Score Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ backgroundColor: scoreBg, borderRadius: "20px", padding: "36px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "40px", flexWrap: "wrap" }}>
            <div style={{ textAlign: "center", minWidth: "140px" }}>
              <div style={{ fontSize: "80px", fontWeight: 800, color: scoreColor, lineHeight: 1 }}>{Math.round(readinessScore)}</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: scoreColor, marginTop: "4px" }}>Readiness</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: scoreColor, marginTop: "6px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "20px", padding: "4px 14px", display: "inline-block" }}>
                {getReadinessLabel(readinessScore)}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: "280px" }}>
              <div style={{ fontSize: "15px", color: "#4B5563", lineHeight: 1.7, marginBottom: "16px" }}>
                {gapSummary || (readinessScore >= 70
                  ? companyName + " is well-aligned with " + buyerName + "'s requirements. Strong performance across most KPIs."
                  : readinessScore >= 40
                    ? "Some gaps exist between " + companyName + "'s current ESG position and " + buyerName + "'s requirements. Focus on the areas below."
                    : "Significant gaps exist between " + companyName + " and " + buyerName + "'s requirements. Immediate action is needed.")}
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { label: "Requirements Met", value: metGaps.length, color: "#2D6A4F", bg: "#E8F5E9" },
                  { label: "Borderline", value: borderlineGaps.length, color: "#B8860B", bg: "#FFF8E1" },
                  { label: "Gaps", value: gapGaps.length, color: "#9B2226", bg: "#FFEBEE" },
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

        {/* How it's calculated */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "24px", marginBottom: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Info style={{ width: "16px", height: "16px", color: "#D4A843" }} />
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1B4332" }}>How Buyer Readiness is Calculated</h2>
            </div>
            <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7 }}>
              The AI compares your 9 BRSR KPI scores against <strong>{buyerName}</strong>&apos;s specific ESG supplier requirements
              (fetched from the web during the buyer analysis step). Each KPI is evaluated as &quot;met&quot;, &quot;borderline&quot;, or &quot;gap&quot;
              based on what {buyerName} specifically expects from suppliers. The readiness score reflects how many requirements
              you currently meet and how critical the remaining gaps are.
            </div>
            {industryNote && (
              <div style={{ backgroundColor: industryRelevant === false ? "#FFF8E1" : "#E8F5E9", borderRadius: "10px", padding: "12px 16px", marginTop: "14px", border: "1px solid " + (industryRelevant === false ? "#F3D9A4" : "#A7F3D0") }}>
                <div style={{ fontSize: "13px", fontWeight: 600, color: industryRelevant === false ? "#92400E" : "#065F46", marginBottom: "4px" }}>
                  Industry Relevance
                </div>
                <div style={{ fontSize: "13px", color: industryRelevant === false ? "#92400E" : "#065F46", lineHeight: 1.5 }}>
                  {industryNote}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Buyer Priorities */}
        {buyerPriorities.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Building2 style={{ width: "18px", height: "18px", color: "#1B4332" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>{buyerName}&apos;s Top Priorities</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {buyerPriorities.map(function (priority: string, i: number) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "12px 16px", backgroundColor: "#FAFAF7", borderRadius: "10px", border: "1px solid #E2E0DB" }}>
                      <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "12px", fontWeight: 700, color: "#B8860B" }}>
                        {i + 1}
                      </div>
                      <span style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>{priority}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Buyer Requirements Summary */}
        {buyerSummary && buyerSummary.requirements_summary && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <Building2 style={{ width: "18px", height: "18px", color: "#1B4332" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>{buyerName} ESG Requirements</h2>
              </div>
              <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7, marginBottom: "16px", backgroundColor: "#FAFAF7", borderRadius: "12px", padding: "16px" }}>
                {buyerSummary.requirements_summary}
              </div>
              {buyerSummary.relevance_to_msme && (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>Relevance to Your Company</div>
                  <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7 }}>{buyerSummary.relevance_to_msme}</div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Detailed Gap Analysis — Per KPI */}
        {gaps.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>KPI-by-KPI Gap Analysis</h2>
              <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
                How each of your KPIs compares to what {buyerName} requires
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {gaps.map(function (gap: any, i: number) {
                  var statusInfo = getStatusIcon(gap.status);
                  var StatusIcon = statusInfo.icon;

                  return (
                    <div key={i} style={{ backgroundColor: statusInfo.bg, borderRadius: "12px", padding: "18px 20px", border: "1px solid rgba(0,0,0,0.06)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <StatusIcon style={{ width: "16px", height: "16px", color: statusInfo.color }} />
                          <span style={{ fontSize: "15px", fontWeight: 700, color: "#1B4332" }}>{gap.kpi_name}</span>
                        </div>
                        <span style={{ fontSize: "11px", fontWeight: 700, padding: "3px 10px", borderRadius: "6px", backgroundColor: "rgba(0,0,0,0.06)", color: statusInfo.color, textTransform: "uppercase" }}>
                          {statusInfo.label}
                        </span>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "10px" }}>
                        <div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, marginBottom: "2px" }}>YOUR VALUE</div>
                          <div style={{ fontSize: "14px", color: "#1B4332", fontWeight: 600 }}>{gap.current_value || "N/A"}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: "11px", color: "#9CA3AF", fontWeight: 600, marginBottom: "2px" }}>{buyerName.toUpperCase()} REQUIRES</div>
                          <div style={{ fontSize: "14px", color: "#1B4332", fontWeight: 600 }}>{gap.buyer_requirement || "Standard compliance"}</div>
                        </div>
                      </div>

                      {gap.gap_detail && (
                        <div style={{ fontSize: "13px", color: "#4B5563", lineHeight: 1.6 }}>
                          {gap.gap_detail}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* No gap data fallback */}
        {gaps.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>KPI Gap Analysis</h2>
              <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "20px" }}>
                How each BRSR KPI contributes to your buyer readiness
              </p>

              {/* Show KPIs grouped by score */}
              {kpis.filter(function (k) { return (k.score || 0) >= 70; }).length > 0 && (
                <div style={{ marginBottom: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <CheckCircle2 style={{ width: "16px", height: "16px", color: "#2D6A4F" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#2D6A4F" }}>
                      Strong ({kpis.filter(function (k) { return (k.score || 0) >= 70; }).length} KPIs)
                    </span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                    {kpis.filter(function (k) { return (k.score || 0) >= 70; }).map(function (kpi, i) {
                      return (
                        <div key={i} style={{ backgroundColor: "#E8F5E9", borderRadius: "10px", padding: "14px 16px" }}>
                          <div style={{ fontSize: "11px", color: "#9CA3AF" }}>KPI {kpi.kpi_number}</div>
                          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>{kpi.kpi_name}</div>
                          <div style={{ fontSize: "24px", fontWeight: 800, color: "#2D6A4F" }}>{kpi.score}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {kpis.filter(function (k) { var s = k.score || 0; return s < 70; }).length > 0 && (
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                    <AlertTriangle style={{ width: "16px", height: "16px", color: "#B8860B" }} />
                    <span style={{ fontSize: "14px", fontWeight: 700, color: "#B8860B" }}>
                      Needs Improvement ({kpis.filter(function (k) { return (k.score || 0) < 70; }).length} KPIs)
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {kpis.filter(function (k) { return (k.score || 0) < 70; }).map(function (kpi, i) {
                      return (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px", backgroundColor: (kpi.score || 0) < 40 ? "#FFEBEE" : "#FFF8E1", borderRadius: "10px" }}>
                          <div style={{ fontSize: "22px", fontWeight: 800, color: (kpi.score || 0) < 40 ? "#9B2226" : "#B8860B", minWidth: "44px", textAlign: "center" }}>{kpi.score}</div>
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: 700, color: "#1B4332" }}>{kpi.kpi_name}</div>
                            <div style={{ fontSize: "12px", color: "#6B7280" }}>{kpi.display_value || ""}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Action CTA */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ backgroundColor: "#1B4332", borderRadius: "16px", padding: "28px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: "18px", fontWeight: 700, color: "white", marginBottom: "6px" }}>Ready to close the gaps?</div>
              <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.75)" }}>
                Get a personalised action plan with step-by-step guidance to improve your buyer readiness score.
              </div>
            </div>
            <button
              onClick={function () { router.push("/action?id=" + assessmentId); }}
              style={{ backgroundColor: "#D4A843", color: "#1B4332", padding: "14px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}
            >
              View Action Plan →
            </button>
          </div>
        </motion.div>

        {/* Back */}
        <button
          onClick={function () { router.push("/assess/results?id=" + assessmentId); }}
          style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", color: "#6B7280", padding: "14px 28px", borderRadius: "12px", fontSize: "14px", fontWeight: 500, border: "1px solid #E2E0DB", cursor: "pointer", marginBottom: "40px" }}
        >
          <ArrowLeft style={{ width: "16px", height: "16px" }} /> Back to Results
        </button>
      </div>
    </div>
  );
}