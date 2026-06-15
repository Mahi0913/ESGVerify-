"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowLeft, Shield, AlertTriangle, CheckCircle2, Info, TrendingDown } from "lucide-react";

const API = "http://localhost:8000";

function getRiskColor(risk: number) {
  if (risk < 35) return "#2D6A4F";
  if (risk < 65) return "#B8860B";
  return "#9B2226";
}

function getRiskBg(risk: number) {
  if (risk < 35) return "#E8F5E9";
  if (risk < 65) return "#FFF8E1";
  return "#FFEBEE";
}

function getRiskLabel(risk: number) {
  if (risk < 35) return "Low Risk";
  if (risk < 65) return "Medium Risk";
  return "High Risk";
}

function getRiskDescription(risk: number) {
  if (risk < 35)
    return "Your ESG claims are well-supported by the data you've provided. Low inconsistency across signals indicates genuine sustainability practices rather than performative reporting.";
  if (risk < 65)
    return "Some inconsistencies detected between your reported ESG metrics. Medium risk means certain claims need stronger data backing. Review flagged signals to reduce greenwashing exposure.";
  return "Significant gaps detected between ESG claims and supporting data. High greenwash risk may deter buyers and invite regulatory scrutiny. Immediate action on flagged signals is recommended.";
}

export default function GreenwashPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [greenwash, setGreenwash] = useState<any>(null);

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
        setGreenwash(a.fuzzy_data?.greenwash || null);
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Shield style={{ width: "40px", height: "40px", color: "#1B4332" }} />
        </motion.div>
        <p style={{ fontSize: "16px", color: "#1B4332", marginTop: "20px", fontWeight: 600 }}>Loading Greenwash Analysis...</p>
      </div>
    );
  }

  var riskScore = greenwash?.risk_score || 0;
  var signals = greenwash?.signals || {};
  var explanations = greenwash?.explanations || [];
  var riskColor = getRiskColor(riskScore);
  var riskBg = getRiskBg(riskScore);
  var riskLabel = getRiskLabel(riskScore);

  var signalEntries = Object.entries(signals) as [string, number][];
  var highSignals = signalEntries.filter(function (e) { return e[1] > 0.5; });
  var medSignals = signalEntries.filter(function (e) { return e[1] > 0.2 && e[1] <= 0.5; });
  var lowSignals = signalEntries.filter(function (e) { return e[1] <= 0.2; });

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
            <Shield style={{ width: "18px", height: "18px", color: riskColor }} />
            <span style={{ fontSize: "14px", fontWeight: 600, color: riskColor }}>Greenwash Risk Detail</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>
            {assessment?.company_data?.company_name || "Your Company"}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
            Mamdani Fuzzy Inference System · {signalEntries.length} signals analysed
          </p>
        </motion.div>

        {/* Big Risk Score Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div style={{ backgroundColor: riskBg, borderRadius: "20px", padding: "36px", marginBottom: "24px", display: "flex", alignItems: "center", gap: "40px" }}>
            <div style={{ textAlign: "center", minWidth: "140px" }}>
              <div style={{ fontSize: "80px", fontWeight: 800, color: riskColor, lineHeight: 1 }}>{Math.round(riskScore)}</div>
              <div style={{ fontSize: "16px", fontWeight: 600, color: riskColor, marginTop: "4px" }}>Risk Score</div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: riskColor, marginTop: "6px", backgroundColor: "rgba(0,0,0,0.06)", borderRadius: "20px", padding: "4px 14px", display: "inline-block" }}>
                {riskLabel}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: "16px", color: "#4B5563", lineHeight: 1.7, marginBottom: "16px" }}>
                {getRiskDescription(riskScore)}
              </div>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {[
                  { label: "High Signals", value: highSignals.length, color: "#9B2226", bg: "#FFEBEE" },
                  { label: "Medium Signals", value: medSignals.length, color: "#B8860B", bg: "#FFF8E1" },
                  { label: "Low Signals", value: lowSignals.length, color: "#2D6A4F", bg: "#E8F5E9" },
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
              <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1B4332" }}>How Greenwash Risk is Calculated</h2>
            </div>
            <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7 }}>
              We use a <strong>Mamdani Fuzzy Inference System (FIS)</strong> to detect greenwashing. Each of the {signalEntries.length} signals below is rated
              as a degree of truth (0–100%) using fuzzy membership functions. Signals that show high degrees of greenwashing
              (e.g. overclaiming without data, inconsistency between sections) contribute to the final risk score.
            </div>
            <div style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7, marginTop: "10px" }}>
              <strong style={{ color: "#1B4332" }}>Risk Scale:</strong> &lt;35 = Low · 35–65 = Medium · &gt;65 = High
            </div>
          </div>
        </motion.div>

        {/* Key Explanations */}
        {explanations.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "16px" }}>Key Findings</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {explanations.map(function (exp: string, i: number) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px", backgroundColor: "#FAFAF7", borderRadius: "10px", border: "1px solid #E2E0DB" }}>
                      <AlertTriangle style={{ width: "16px", height: "16px", color: "#B8860B", marginTop: "2px", flexShrink: 0 }} />
                      <p style={{ fontSize: "14px", color: "#374151", lineHeight: 1.6, margin: 0 }}>{exp}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* All Signals */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>Signal Analysis</h2>
            <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "24px" }}>
              Each signal measures a specific greenwashing pattern. Higher % = stronger greenwashing signal.
            </p>

            {signalEntries.length === 0 ? (
              <div style={{ fontSize: "14px", color: "#9CA3AF", textAlign: "center", padding: "24px" }}>No signal data available</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {signalEntries
                  .sort(function (a, b) { return b[1] - a[1]; })
                  .map(function (entry, i) {
                    var signalName = entry[0];
                    var degree = entry[1];
                    var pct = Math.round(degree * 100);
                    var barColor = degree > 0.5 ? "#9B2226" : degree > 0.2 ? "#B8860B" : "#2D6A4F";
                    var barBg = degree > 0.5 ? "#FFEBEE" : degree > 0.2 ? "#FFF8E1" : "#E8F5E9";
                    var Icon = degree > 0.5 ? AlertTriangle : degree > 0.2 ? Info : CheckCircle2;

                    return (
                      <motion.div
                        key={signalName}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.45 + i * 0.04 }}
                        style={{ padding: "16px", backgroundColor: "#FAFAF7", borderRadius: "12px", border: "1px solid #E2E0DB" }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "10px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <Icon style={{ width: "15px", height: "15px", color: barColor, flexShrink: 0 }} />
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332", textTransform: "capitalize" }}>
                              {signalName.replace(/_/g, " ")}
                            </span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "14px", fontWeight: 700, color: barColor }}>{pct}%</span>
                            <div style={{ backgroundColor: barBg, color: barColor, fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px" }}>
                              {degree > 0.5 ? "High" : degree > 0.2 ? "Medium" : "Low"}
                            </div>
                          </div>
                        </div>
                        <div style={{ width: "100%", height: "8px", backgroundColor: "#EEE", borderRadius: "4px", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: Math.max(pct, 1) + "%" }}
                            transition={{ duration: 0.8, delay: 0.5 + i * 0.04, ease: "easeOut" }}
                            style={{ height: "100%", backgroundColor: barColor, borderRadius: "4px" }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
              </div>
            )}
          </div>
        </motion.div>

        {/* Actions to Reduce Risk */}
        {highSignals.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <div style={{ backgroundColor: "#FFEBEE", borderRadius: "16px", border: "1px solid #FFCDD2", padding: "28px", marginBottom: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <TrendingDown style={{ width: "18px", height: "18px", color: "#9B2226" }} />
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#9B2226" }}>How to Reduce Your Risk</h2>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {highSignals.map(function (entry, i) {
                  return (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "10px", fontSize: "14px", color: "#374151", lineHeight: 1.6 }}>
                      <span style={{ color: "#9B2226", fontWeight: 700, flexShrink: 0 }}>{i + 1}.</span>
                      <span>
                        <strong style={{ color: "#1B4332", textTransform: "capitalize" }}>{entry[0].replace(/_/g, " ")}:</strong>{" "}
                        Provide documented evidence and third-party verification for this area to reduce the greenwash signal.
                      </span>
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
