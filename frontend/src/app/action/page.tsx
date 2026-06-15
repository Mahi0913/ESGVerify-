"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowLeft, ArrowRight, Loader2, Lightbulb, Clock, TrendingUp, IndianRupee, SlidersHorizontal, ChevronDown, ChevronUp, Zap, Target, Droplets, Users, ShieldAlert } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ActionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [expandedSugg, setExpandedSugg] = useState<number | null>(null);

  // What-if simulator
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [sliders, setSliders] = useState({
    wages_paid: 0,
    electricity_units: 0,
    water_recycled_daily: 0,
    women_workers: 0,
    safety_incidents: 0,
  });
  const [originalAnswers, setOriginalAnswers] = useState<any>({});
  const [originalScore, setOriginalScore] = useState(0);

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
        setOriginalScore(a.overall_score || 0);
        setOriginalAnswers(a.answers || {});

        var ans = a.answers || {};
        setSliders({
          wages_paid: parseInt(ans.wages_paid) || 400,
          electricity_units: parseInt(ans.electricity_units) || 8000,
          water_recycled_daily: parseInt(ans.water_recycled_daily) || 1500,
          women_workers: parseInt(ans.women_workers) || 40,
          safety_incidents: parseInt(ans.safety_incidents) || 2,
        });

        if (a.suggestions && Object.keys(a.suggestions).length > 0) {
          setSuggestions(a.suggestions);
          setLoading(false);
          return;
        }

        try {
          var suggRes = await fetch(API + "/api/generate-suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kpis: a.kpis || [],
              gap_analysis: a.gap_analysis || {},
              company_data: a.company_data || {},
              buyer_name: a.company_data?.buyer_name || "",
              govt_schemes_results: [],
            }),
          });
          var suggData = await suggRes.json();
          setSuggestions(suggData);

          await fetch(API + "/api/assessments/" + assessmentId, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ suggestions: suggData }),
          });
        } catch (err) {
          console.error("Failed to generate suggestions");
        }
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  var debounceTimer: any = null;

  function handleSliderChange(key: string, value: number) {
    var newSliders = Object.assign({}, sliders, { [key]: value });
    setSliders(newSliders);

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(function () {
      runSimulation(newSliders);
    }, 500);
  }

  async function runSimulation(newSliders: any) {
    setSimulating(true);
    var cd = assessment?.company_data || {};
    var calcData = Object.assign({}, cd);

    Object.keys(originalAnswers).forEach(function (key) {
      var val = originalAnswers[key];
      if (val === "" || val === null || val === undefined) return;
      var numVal = Number(val);
      if (!isNaN(numVal) && val !== "") {
        calcData[key] = numVal;
      } else {
        calcData[key] = val;
      }
    });

    Object.keys(newSliders).forEach(function (key) {
      calcData[key] = newSliders[key];
    });

    if (cd.state) calcData.state = cd.state;
    if (cd.industry) calcData.industry = cd.industry;
    if (cd.buyer_name) calcData.buyer_name = cd.buyer_name;

    try {
      var res = await fetch(API + "/api/calculate-kpis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: calcData }),
      });
      var data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error("Simulation failed");
    }
    setSimulating(false);
  }

  function getDiffColor(diff: number) {
    if (diff > 0) return "#2D6A4F";
    if (diff < 0) return "#9B2226";
    return "#6B7280";
  }

  function getPriorityColor(priority: any) {
    var p = String(priority || "medium").toLowerCase();
    if (p === "high" || p === "critical" || p === "1" || p === "2") return { bg: "#FEF2F2", color: "#9B2226", border: "#FECACA" };
    if (p === "medium" || p === "3" || p === "4") return { bg: "#FFF8E1", color: "#B8860B", border: "#F3D9A4" };
    return { bg: "#E8F5E9", color: "#2D6A4F", border: "#A7F3D0" };
  }

  function getPhaseStyle(phase: string) {
    if (phase === "immediate") return { dotColor: "#9B2226", lineColor: "#FECACA", label: "Do this week" };
    if (phase === "short_term") return { dotColor: "#B8860B", lineColor: "#F3D9A4", label: "Next 2-4 weeks" };
    if (phase === "medium_term") return { dotColor: "#2D6A4F", lineColor: "#A7F3D0", label: "1-3 months" };
    return { dotColor: "#6D28D9", lineColor: "#DDD6FE", label: "Continuous" };
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <Lightbulb style={{ width: "32px", height: "32px", color: "#D4A843", marginBottom: "16px" }} />
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1B4332", marginBottom: "8px" }}>Generating improvement suggestions...</h2>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>AI is analyzing your gaps and creating an action plan</p>
      </div>
    );
  }

  var suggList = suggestions?.suggestions || [];
  var actionPlan = suggestions?.action_plan || {};
  var projectedScore = simResult?.overall?.score || originalScore;
  var scoreDiff = Math.round(projectedScore - originalScore);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={function () { router.push("/assess/results?id=" + assessmentId); }} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <ArrowLeft style={{ width: "16px", height: "16px" }} /> Results
            </button>
            <button onClick={function () { router.push("/dashboard"); }} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer" }}>Dashboard</button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "32px 24px" }}>
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "4px" }}>Action Plan & Simulator</h1>
          <p style={{ fontSize: "15px", color: "#6B7280", marginBottom: "28px" }}>
            AI-generated improvement suggestions based on your scores and buyer requirements.
          </p>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Left: Suggestions */}
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Lightbulb style={{ width: "18px", height: "18px", color: "#D4A843" }} />
              Priority Suggestions
            </h2>

            {suggList.length === 0 ? (
              <div style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "32px", textAlign: "center" }}>
                <p style={{ color: "#6B7280", fontSize: "15px" }}>No suggestions generated yet.</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {suggList.map(function (sugg: any, i: number) {
                  var isExpanded = expandedSugg === i;
                  var pColor = getPriorityColor(sugg.priority || sugg.difficulty);

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E0DB", overflow: "hidden" }}
                    >
                      <button
                        onClick={function () { setExpandedSugg(isExpanded ? null : i); }}
                        style={{ width: "100%", padding: "14px 16px", display: "flex", alignItems: "center", gap: "12px", background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                      >
                        <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: "13px", fontWeight: 700, color: "#B8860B" }}>
                          {i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B4332" }}>{sugg.title}</div>
                          {sugg.kpi_affected && <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>Improves: {sugg.kpi_affected}</div>}
                        </div>
                        <span style={{ fontSize: "10px", fontWeight: 600, padding: "3px 8px", borderRadius: "6px", backgroundColor: pColor.bg, color: pColor.color, border: "1px solid " + pColor.border, textTransform: "uppercase" }}>
                          {sugg.priority || sugg.difficulty || "Medium"}
                        </span>
                        {isExpanded ? <ChevronUp style={{ width: "16px", height: "16px", color: "#9CA3AF" }} /> : <ChevronDown style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />}
                      </button>

                      {isExpanded && (
                        <div style={{ padding: "0 16px 16px 56px", borderTop: "1px solid #F3F2EE" }}>
                          <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.7, marginTop: "12px", marginBottom: "10px" }}>{sugg.description}</p>
                          {sugg.priority_reasoning && (
                            <div style={{ backgroundColor: "#FAFAF7", borderRadius: "8px", padding: "10px 14px", border: "1px solid #E2E0DB" }}>
                              <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5, fontStyle: "italic", margin: 0 }}>{sugg.priority_reasoning}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Phased Action Plan — Timeline Design */}
            {Object.keys(actionPlan).length > 0 && (
              <div style={{ marginTop: "28px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Clock style={{ width: "18px", height: "18px", color: "#1B4332" }} />
                  Phased Action Plan
                </h2>
                <div style={{ position: "relative", paddingLeft: "28px" }}>
                  {/* Vertical line */}
                  <div style={{ position: "absolute", left: "7px", top: "8px", bottom: "8px", width: "2px", backgroundColor: "#E2E0DB" }} />

                  {["immediate", "short_term", "medium_term", "ongoing"].map(function (phase) {
                    var items = actionPlan[phase];
                    if (!items || (Array.isArray(items) && items.length === 0)) return null;
                    var ps = getPhaseStyle(phase);
                    var itemList = Array.isArray(items) ? items : [items];

                    return (
                      <div key={phase} style={{ marginBottom: "24px", position: "relative" }}>
                        {/* Dot on timeline */}
                        <div style={{
                          position: "absolute", left: "-24px", top: "4px",
                          width: "14px", height: "14px", borderRadius: "50%",
                          backgroundColor: ps.dotColor, border: "3px solid white",
                          boxShadow: "0 0 0 2px " + ps.dotColor,
                        }} />

                        <div style={{ marginBottom: "4px", display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontSize: "15px", fontWeight: 700, color: ps.dotColor, textTransform: "capitalize" }}>
                            {phase.replace(/_/g, " ")}
                          </span>
                          <span style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 500 }}>{ps.label}</span>
                        </div>

                        {itemList.map(function (item: any, i: number) {
                          var text = typeof item === "string" ? item : (item.task || item.action || item.title || JSON.stringify(item));
                          return (
                            <div key={i} style={{ display: "flex", alignItems: "start", gap: "8px", marginTop: "6px" }}>
                              <div style={{ width: "5px", height: "5px", borderRadius: "50%", backgroundColor: "#9CA3AF", marginTop: "7px", flexShrink: 0 }} />
                              <p style={{ fontSize: "14px", color: "#4B5563", lineHeight: 1.6, margin: 0 }}>{text}</p>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right: What-If Simulator */}
          <div>
            <div style={{ position: "sticky", top: "80px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <SlidersHorizontal style={{ width: "18px", height: "18px", color: "#D4A843" }} />
                What-If Simulator
              </h2>

              <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "24px" }}>
                {/* Explanation */}
                <div style={{ backgroundColor: "#E8F5E9", borderRadius: "10px", padding: "14px 16px", marginBottom: "20px", border: "1px solid #A7F3D0" }}>
                  <p style={{ fontSize: "14px", color: "#065F46", lineHeight: 1.6, margin: 0 }}>
                    Drag any slider below to see how improving that area would change your ESG score.
                    The score updates automatically try different combinations to find the most impactful changes for your factory.
                  </p>
                </div>

                {/* Score Display — Redesigned */}
                <div style={{ backgroundColor: "#FAFAF7", borderRadius: "14px", padding: "20px", marginBottom: "24px", textAlign: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "20px" }}>
                    <div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "4px", fontWeight: 500 }}>Your Score Now</div>
                      <div style={{ fontSize: "40px", fontWeight: 800, color: "#6B7280", lineHeight: 1 }}>{Math.round(originalScore)}</div>
                    </div>

                    <div style={{ fontSize: "24px", color: "#D4A843" }}>→</div>

                    <div>
                      <div style={{ fontSize: "12px", color: "#9CA3AF", marginBottom: "4px", fontWeight: 500 }}>After Changes</div>
                      <div style={{ fontSize: "40px", fontWeight: 800, color: simulating ? "#9CA3AF" : getDiffColor(scoreDiff), lineHeight: 1 }}>
                        {simulating ? "..." : Math.round(projectedScore)}
                      </div>
                    </div>
                  </div>

                  {!simulating && scoreDiff !== 0 && (
                    <div style={{
                      display: "inline-block", marginTop: "12px",
                      padding: "4px 14px", borderRadius: "20px",
                      backgroundColor: scoreDiff > 0 ? "#E8F5E9" : "#FFEBEE",
                      color: getDiffColor(scoreDiff),
                      fontSize: "14px", fontWeight: 700,
                    }}>
                      {scoreDiff > 0 ? "+" + scoreDiff + " points improvement" : scoreDiff + " points"}
                    </div>
                  )}

                  {!simulating && scoreDiff === 0 && simResult && (
                    <div style={{ marginTop: "10px", fontSize: "13px", color: "#9CA3AF" }}>
                      No change — try adjusting the sliders
                    </div>
                  )}
                </div>

                {/* Sliders — Better Labels */}
                <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
                  {[
                    { key: "wages_paid", label: "Daily Wages", unit: "Rs/day", min: 200, max: 800, step: 10, icon: IndianRupee, hint: "Higher wages improve Wage Parity KPI" },
                    { key: "electricity_units", label: "Monthly Electricity", unit: "kWh", min: 1000, max: 30000, step: 500, icon: Zap, hint: "Lower usage improves Energy & GHG KPIs" },
                    { key: "water_recycled_daily", label: "Water Recycled Daily", unit: "litres", min: 0, max: 10000, step: 100, icon: Droplets, hint: "More recycling improves Water Footprint KPI" },
                    { key: "women_workers", label: "Women Workers", unit: "count", min: 0, max: 200, step: 5, icon: Users, hint: "More women improves Gender Diversity KPI" },
                    { key: "safety_incidents", label: "Safety Incidents", unit: "per year", min: 0, max: 20, step: 1, icon: ShieldAlert, hint: "Fewer incidents improves Safety (LTIFR) KPI" },
                  ].map(function (slider) {
                    var SliderIcon = slider.icon;
                    var val = (sliders as any)[slider.key] || 0;
                    var origVal = parseInt(originalAnswers[slider.key]) || 0;
                    var changed = val !== origVal;

                    return (
                      <div key={slider.key}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <SliderIcon style={{ width: "14px", height: "14px", color: "#1B4332" }} />
                            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>{slider.label}</span>
                          </div>
                          <span style={{ fontSize: "14px", fontWeight: 700, color: changed ? "#D4A843" : "#1B4332" }}>
                            {val} {slider.unit}
                            {changed && <span style={{ fontSize: "11px", color: "#9CA3AF", marginLeft: "4px" }}>(was {origVal})</span>}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "6px" }}>{slider.hint}</div>
                        <input
                          type="range"
                          min={slider.min}
                          max={slider.max}
                          step={slider.step}
                          value={val}
                          onChange={function (e) { handleSliderChange(slider.key, parseInt(e.target.value)); }}
                          style={{ width: "100%", accentColor: "#1B4332", cursor: "pointer" }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#C5C5C0" }}>
                          <span>{slider.min}</span>
                          <span>{slider.max}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Reset */}
                <button
                  onClick={function () {
                    setSliders({
                      wages_paid: parseInt(originalAnswers.wages_paid) || 400,
                      electricity_units: parseInt(originalAnswers.electricity_units) || 8000,
                      water_recycled_daily: parseInt(originalAnswers.water_recycled_daily) || 1500,
                      women_workers: parseInt(originalAnswers.women_workers) || 40,
                      safety_incidents: parseInt(originalAnswers.safety_incidents) || 2,
                    });
                    setSimResult(null);
                  }}
                  style={{ marginTop: "16px", width: "100%", padding: "12px", borderRadius: "10px", backgroundColor: "#F3F2EE", color: "#6B7280", fontSize: "14px", fontWeight: 500, border: "1px solid #E2E0DB", cursor: "pointer" }}
                >
                  Reset to Original Values
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
