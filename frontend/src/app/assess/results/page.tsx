"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Leaf, ArrowLeft, ArrowRight, BarChart3, Shield, Brain, Target,
  FileText, TrendingUp, Download, Loader2, Info
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState("Loading assessment...");
  const [assessment, setAssessment] = useState<any>(null);
  const [kpis, setKpis] = useState<any[]>([]);
  const [overall, setOverall] = useState<any>(null);
  const [greenwash, setGreenwash] = useState<any>(null);
  const [confidence, setConfidence] = useState<any>(null);
  const [gapAnalysis, setGapAnalysis] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(function () {
    if (!assessmentId) return;
    var token = localStorage.getItem("token");
    if (!token) return;

    fetch(API + "/api/assessments/" + assessmentId, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) { return res.json(); })
      .then(async function (data) {
        var a = data.assessment;
        if (!a) return;
        setAssessment(a);

        // If already calculated, load from saved data
        if (a.kpis && a.kpis.length > 0 && a.fuzzy_data?.greenwash) {
          setKpis(a.kpis);
          setOverall(a.fuzzy_data?.overall || null);
          setGreenwash(a.fuzzy_data?.greenwash || null);
          setConfidence(a.fuzzy_data?.confidence || null);
          setGapAnalysis(a.gap_analysis || null);
          setLoading(false);
          return;
        }

        // ─── STEP 1: Build calcData from answers + company_data ───
        var answers = a.answers || {};
        var cd = a.company_data || {};
        var calcData = Object.assign({}, cd);

        Object.keys(answers).forEach(function (key) {
          var val = answers[key];
          if (val === "" || val === null || val === undefined) return;
          var numVal = Number(val);
          if (!isNaN(numVal) && val !== "") {
            calcData[key] = numVal;
          } else {
            calcData[key] = val;
          }
        });

        if (cd.state) calcData.state = cd.state;
        if (cd.industry) calcData.industry = cd.industry;
        if (cd.buyer_name) calcData.buyer_name = cd.buyer_name;
        if (cd.gstin) calcData.gstin = cd.gstin;
        if (cd.company_name) calcData.company_name = cd.company_name;
        if (a.buyer_summary) calcData.buyer_summary = a.buyer_summary;

        try {
          // ─── STEP 2: Calculate KPIs ───
          setLoadingStep("Calculating 9 BRSR KPIs...");
          var kpiRes = await fetch(API + "/api/calculate-kpis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: calcData }),
          });
          var kpiData = await kpiRes.json();
          var calculatedKpis = kpiData.kpis || [];
          setKpis(calculatedKpis);
          setOverall(kpiData.overall || null);

          // ─── STEP 3: Run verification + fuzzy scores ───
          setLoadingStep("Running 17 verification checks...");
          var checks = a.verification_checks || [];
          var fuzzyRes = await fetch(API + "/api/fuzzy-scores", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checks: checks, kpis: calculatedKpis, company_data: calcData }),
          });
          var fuzzyData = await fuzzyRes.json();
          setGreenwash(fuzzyData.greenwash || null);
          setConfidence(fuzzyData.confidence || null);
          if (fuzzyData.overall) setOverall(fuzzyData.overall);

          // ─── STEP 4: Run gap analysis for REAL buyer readiness ───
          setLoadingStep("Analyzing buyer readiness for " + (cd.buyer_name || "buyer") + "...");
          var gapData = null;
          try {
            var gapRes = await fetch(API + "/api/analyze-gaps", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                kpis: calculatedKpis,
                buyer_name: cd.buyer_name || "",
                buyer_search_results: a.buyer_search || [],
                company_data: calcData,
              }),
            });
            gapData = await gapRes.json();
            setGapAnalysis(gapData);
          } catch (gapErr) {
            console.error("Gap analysis failed, using fallback", gapErr);
            gapData = { readiness_score: Math.max(0, 100 - (fuzzyData.greenwash?.risk_score || 0)) };
            setGapAnalysis(gapData);
          }

          // ─── STEP 5: Save everything to the assessment ───
          setLoadingStep("Saving results...");
          var overallScore = fuzzyData.overall?.score || kpiData.overall?.score || 0;
          var gwRisk = fuzzyData.greenwash?.risk_score || 0;
          var confScore = typeof fuzzyData.confidence === "number"
            ? fuzzyData.confidence
            : (fuzzyData.confidence?.overall_score || fuzzyData.confidence?.score || 0);

          await fetch(API + "/api/assessments/" + assessmentId, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({
              kpis: calculatedKpis,
              fuzzy_data: {
                overall: fuzzyData.overall || kpiData.overall,
                greenwash: fuzzyData.greenwash,
                confidence: fuzzyData.confidence,
              },
              gap_analysis: gapData,
              overall_score: overallScore,
              greenwash_risk: gwRisk,
              data_confidence: confScore,
              status: "completed",
            }),
          });
        } catch (err) {
          console.error("Calculation failed", err);
        }
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  async function downloadPDF() {
    setDownloading(true);
    var token = localStorage.getItem("token");
    var a = assessment;
    try {
      var res = await fetch(API + "/api/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          company_data: a.company_data,
          kpis: kpis,
          verification_checks: a.verification_checks || [],
          gap_analysis: gapAnalysis || a.gap_analysis || {},
          suggestions_data: a.suggestions || {},
          fuzzy_data: {
            overall: overall || {},
            greenwash: greenwash || {},
            confidence: confidence || {},
          },
        }),
      });
      var blob = await res.blob();
      var url = window.URL.createObjectURL(blob);
      var link = document.createElement("a");
      link.href = url;
      link.download = "ESGVerify_Report.pdf";
      link.click();
    } catch (err) {
      console.error("PDF download failed");
    }
    setDownloading(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <Brain style={{ width: "40px", height: "40px", color: "#1B4332" }} />
        </motion.div>
        <p style={{ fontSize: "16px", color: "#1B4332", marginTop: "20px", fontWeight: 600 }}>
          Calculating your ESG scores...
        </p>
        <p style={{ fontSize: "14px", color: "#6B7280", marginTop: "6px" }}>
          {loadingStep}
        </p>
      </div>
    );
  }

  var esgScore = overall?.score || 0;
  var gwScore = greenwash?.risk_score || 0;
  var confScore = typeof confidence === "number"
    ? confidence
    : (confidence?.overall_score || confidence?.score || 0);
  var buyerScore = gapAnalysis?.readiness_score || assessment?.gap_analysis?.readiness_score || 0;
  var buyerName = assessment?.company_data?.buyer_name || "Buyer";
  var companyName = assessment?.company_data?.company_name || "Your Company";

  var foreignBuyers = ["H&M", "Nike", "Apple", "IKEA", "Zara", "Inditex", "Walmart", "Amazon", "Adidas", "Tesla", "Decathlon", "Bosch", "Samsung", "Toyota", "Hyundai"];
  var isForeignBuyer = foreignBuyers.some(function (b) { return (buyerName || "").toLowerCase().includes(b.toLowerCase()); });

  var scoreCards = [
    {
      label: "ESG Score",
      subtitle: "BRSR Core weighted performance",
      score: esgScore,
      icon: BarChart3,
      bg: "#E8F5E9",
      color: "#2D6A4F",
      link: "/assess/score/esg?id=" + assessmentId,
    },
    {
      label: "Greenwash Risk",
      subtitle: "Data credibility assessment",
      score: gwScore,
      icon: Shield,
      bg: gwScore < 35 ? "#E8F5E9" : gwScore < 65 ? "#FFF8E1" : "#FFEBEE",
      color: gwScore < 35 ? "#2D6A4F" : gwScore < 65 ? "#B8860B" : "#9B2226",
      link: "/assess/score/greenwash?id=" + assessmentId,
    },
    {
      label: "Data Confidence",
      subtitle: "Verification consistency",
      score: confScore,
      icon: Brain,
      bg: "#EDE9FE",
      color: "#6D28D9",
      link: "/assess/score/confidence?id=" + assessmentId,
    },
    {
      label: "Buyer Readiness",
      subtitle: "Ready for " + buyerName,
      score: buyerScore,
      icon: Target,
      bg: "#FFF8E1",
      color: "#B8860B",
      link: "/assess/score/buyer?id=" + assessmentId,
    },
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      {/* Nav */}
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <button
            onClick={function () { router.push("/dashboard"); }}
            style={{ display: "flex", alignItems: "center", gap: "6px", background: "none", border: "1px solid #E2E0DB", color: "#6B7280", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
          >
            <ArrowLeft style={{ width: "14px", height: "14px" }} /> Dashboard
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>
            Assessment Results
          </h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "24px" }}>
            {companyName} · Click any score card to see detailed breakdown and reasoning
          </p>
        </motion.div>

        {/* Foreign buyer BRSR explanation */}
        {isForeignBuyer && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <div style={{
              backgroundColor: "#E8F5E9", borderRadius: "12px",
              padding: "16px 20px", marginBottom: "24px",
              border: "1px solid #A7F3D0",
            }}>
              <p style={{ fontSize: "14px", color: "#065F46", lineHeight: 1.7, margin: 0 }}>
                Your ESG Score is based on SEBI BRSR Core — India&apos;s mandatory sustainability framework.
                Even though {buyerName} is based outside India, you need BRSR compliance
                because your Indian listed buyer (the intermediary company) is required by SEBI to collect
                this data from all MSME suppliers starting FY 2026-27.
                Your Buyer Readiness score additionally checks requirements specific to {buyerName}.
              </p>
            </div>
          </motion.div>
        )}

        {/* 4 Score Cards — 2x2 Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginBottom: "28px" }}>
          {scoreCards.map(function (card, i) {
            var CardIcon = card.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1 }}
                onClick={function () { router.push(card.link); }}
                style={{
                  backgroundColor: card.bg, borderRadius: "20px", padding: "28px",
                  cursor: "pointer", position: "relative", overflow: "hidden",
                  minHeight: "180px", display: "flex", flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "box-shadow 0.3s, transform 0.2s",
                }}
                onMouseEnter={function (e) {
                  e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.1)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={function (e) {
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ position: "absolute", top: "-20px", right: "-20px", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: card.color, opacity: 0.08 }} />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <CardIcon style={{ width: "18px", height: "18px", color: card.color }} />
                    <span style={{ fontSize: "15px", fontWeight: 600, color: card.color }}>{card.label}</span>
                  </div>
                  <ArrowRight style={{ width: "16px", height: "16px", color: card.color, opacity: 0.5 }} />
                </div>
                <div>
                  <div style={{ fontSize: "52px", fontWeight: 800, color: card.color, lineHeight: 1 }}>
                    {Math.round(card.score)}
                  </div>
                  <div style={{ fontSize: "13px", color: card.color, opacity: 0.7, marginTop: "4px" }}>
                    {card.subtitle}
                  </div>
                </div>
                <div style={{ width: "100%", height: "6px", backgroundColor: "rgba(0,0,0,0.08)", borderRadius: "3px" }}>
                  <div style={{
                    width: Math.min(card.score, 100) + "%", height: "100%",
                    backgroundColor: card.color, borderRadius: "3px",
                    transition: "width 1s ease-out",
                  }} />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
              <Info style={{ width: "18px", height: "18px", color: "#1B4332" }} />
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>Assessment Summary</h2>
            </div>

            <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: 1.8 }}>
              {esgScore >= 70
                ? companyName + " demonstrates strong ESG performance with a score of " + Math.round(esgScore) + "/100. Your data confidence is " + Math.round(confScore) + "/100 and greenwash risk is " + (gwScore < 35 ? "low" : gwScore < 65 ? "moderate" : "high") + " at " + Math.round(gwScore) + "/100. " + (buyerScore > 0 ? "Buyer readiness for " + buyerName + " is " + Math.round(buyerScore) + "/100." : "")
                : esgScore >= 40
                  ? companyName + " shows moderate ESG performance at " + Math.round(esgScore) + "/100. Data confidence is " + Math.round(confScore) + "/100 and greenwash risk is " + Math.round(gwScore) + "/100. " + (buyerScore > 0 ? "Buyer readiness for " + buyerName + " is " + Math.round(buyerScore) + "/100 — some improvements are needed to meet their requirements." : "") + " Review the detailed score pages for specific action items."
                  : companyName + " has significant ESG gaps with a score of " + Math.round(esgScore) + "/100. " + (buyerScore > 0 ? "Buyer readiness for " + buyerName + " is only " + Math.round(buyerScore) + "/100." : "") + " Immediate action is required. Click on each score card above to understand what needs to change and why."}
            </p>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "40px" }}
        >
          <button
            onClick={function () { router.push("/action?id=" + assessmentId); }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              backgroundColor: "#D4A843", color: "#1B4332", padding: "14px 28px",
              borderRadius: "12px", fontSize: "15px", fontWeight: 600,
              border: "none", cursor: "pointer", flex: 1, justifyContent: "center",
            }}
          >
            <TrendingUp style={{ width: "18px", height: "18px" }} />
            Action Plan & Simulator
          </button>

          <button
            onClick={downloadPDF}
            disabled={downloading}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              backgroundColor: "#1B4332", color: "white", padding: "14px 28px",
              borderRadius: "12px", fontSize: "15px", fontWeight: 600,
              border: "none", cursor: downloading ? "wait" : "pointer",
              flex: 1, justifyContent: "center",
            }}
          >
            {downloading ? (
              <>
                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                Generating...
              </>
            ) : (
              <>
                <FileText style={{ width: "18px", height: "18px" }} />
                Download PDF Report
              </>
            )}
          </button>

          <button
            onClick={function () { router.push("/dashboard"); }}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              backgroundColor: "white", color: "#6B7280", padding: "14px 28px",
              borderRadius: "12px", fontSize: "15px", fontWeight: 500,
              border: "1px solid #E2E0DB", cursor: "pointer",
            }}
          >
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Dashboard
          </button>
        </motion.div>
      </div>

      <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}