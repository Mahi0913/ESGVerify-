"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowRight, ArrowLeft, Loader2, Zap, Droplets, Trash2, Users, BarChart3, HelpCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const SECTIONS = [
  { id: "energy", label: "Energy", icon: Zap, color: "#D4A843" },
  { id: "water", label: "Water", icon: Droplets, color: "#2D6A4F" },
  { id: "waste", label: "Waste", icon: Trash2, color: "#9B2226" },
  { id: "social", label: "Workers & Safety", icon: Users, color: "#1B4332" },
  { id: "production", label: "Production & Governance", icon: BarChart3, color: "#6B7280" },
];

function getCategory(q: any): string {
  var cat = (q.category || "").toLowerCase();
  if (cat.includes("energy") || cat.includes("electricity") || cat.includes("fuel") || cat.includes("solar") || cat.includes("renewable")) return "energy";
  if (cat.includes("water")) return "water";
  if (cat.includes("waste") || cat.includes("material") || cat.includes("raw")) return "waste";
  if (cat.includes("social") || cat.includes("worker") || cat.includes("safety") || cat.includes("gender") || cat.includes("wage") || cat.includes("training") || cat.includes("benefit")) return "social";
  if (cat.includes("production") || cat.includes("governance") || cat.includes("complaint")) return "production";
  if (cat.includes("buyer")) return "production";
  return "production";
}

export default function DataEntryPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [activeSection, setActiveSection] = useState(0);
  const [companyData, setCompanyData] = useState<any>({});
  const [showTooltip, setShowTooltip] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  useEffect(function () {
    if (!assessmentId) return;
    var token = localStorage.getItem("token");
    if (!token) return;

    fetch(API + "/api/assessments/" + assessmentId, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) { return res.json(); })
      .then(async function (data) {
        var cd = data.assessment?.company_data || {};
        setCompanyData(cd);

        if (data.assessment?.answers && Object.keys(data.assessment.answers).length > 0) {
          setAnswers(data.assessment.answers);
        }

        if (data.assessment?.questions && data.assessment.questions.length > 0) {
          setQuestions(data.assessment.questions);
          setLoading(false);
          return;
        }

        try {
          var buyerText = data.assessment?.buyer_summary?.requirements_summary || "";
          var qRes = await fetch(API + "/api/generate-questions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              industry: cd.industry || "Manufacturing",
              buyer_name: cd.buyer_name || "",
              buyer_requirements_text: buyerText,
            }),
          });
          var qData = await qRes.json();
          setQuestions(qData.questions || []);

          await fetch(API + "/api/assessments/" + assessmentId, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ questions: qData.questions || [] }),
          });
        } catch (err) {
          console.error("Failed to generate questions");
        }
        setLoading(false);
      })
      .catch(function () { setLoading(false); });
  }, [assessmentId]);

  var grouped: Record<string, any[]> = { energy: [], water: [], waste: [], social: [], production: [] };
  questions.forEach(function (q) {
    var cat = getCategory(q);
    if (grouped[cat]) {
      grouped[cat].push(q);
    } else {
      grouped["production"].push(q);
    }
  });

  var sectionKeys = SECTIONS.map(function (s) { return s.id; });
  var currentQuestions = grouped[sectionKeys[activeSection]] || [];

  var totalAnswered = 0;
  var totalRequired = 0;
  questions.forEach(function (q) {
    if (q.required !== false) totalRequired++;
    var key = q.field_key || q.id;
    if (answers[key] !== undefined && answers[key] !== "") totalAnswered++;
  });
  var progressPercent = totalRequired > 0 ? Math.round((totalAnswered / totalRequired) * 100) : 0;

  var sectionProgress = sectionKeys.map(function (secId) {
    var secQs = grouped[secId] || [];
    var answered = 0;
    secQs.forEach(function (q) {
      var key = q.field_key || q.id;
      if (answers[key] !== undefined && answers[key] !== "") answered++;
    });
    return { total: secQs.length, answered: answered };
  });

  function handleAnswer(fieldKey: string, value: any) {
    var newAnswers = Object.assign({}, answers);
    newAnswers[fieldKey] = value;
    setAnswers(newAnswers);

    var token = localStorage.getItem("token");
    if (token && assessmentId) {
      fetch(API + "/api/assessments/" + assessmentId, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ answers: newAnswers }),
      }).catch(function () { });
    }
  }

  function handleNext() {
    // Check required fields in current section
    var currentQs = grouped[sectionKeys[activeSection]] || [];
    var hasEmpty = false;
    currentQs.forEach(function (q) {
      if (q.required !== false) {
        var key = q.field_key || q.id;
        if (!answers[key] && answers[key] !== 0) hasEmpty = true;
      }
    });
    if (hasEmpty && activeSection < SECTIONS.length - 1) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    if (activeSection < SECTIONS.length - 1) {
      setActiveSection(activeSection + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitData();
    }
  }

  function handlePrev() {
    if (activeSection > 0) {
      setActiveSection(activeSection - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      router.push("/assess/buyer?id=" + assessmentId);
    }
  }

  async function submitData() {
    setSaving(true);
    var token = localStorage.getItem("token");
    try {
      await fetch(API + "/api/assessments/" + assessmentId, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ answers: answers, step: 4 }),
      });
      router.push("/assess/verify?id=" + assessmentId);
    } catch (err) {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <Loader2 style={{ width: "32px", height: "32px", color: "#1B4332", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Generating questions for your industry...</p>
        <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <div style={{ fontSize: "13px", color: "#6B7280" }}>Auto-saving as you type</div>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Step Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
          {["Company", "Buyer", "Data Entry", "Verify", "Results"].map(function (step, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flex: i < 4 ? 1 : undefined }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: i <= 2 ? "#1B4332" : "#E2E0DB", color: i <= 2 ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, flexShrink: 0 }}>
                  {i < 2 ? "\u2713" : i + 1}
                </div>
                <span style={{ fontSize: "12px", color: i <= 2 ? "#1B4332" : "#9CA3AF", fontWeight: i === 2 ? 600 : 400 }}>{step}</span>
                {i < 4 && <div style={{ flex: 1, height: "2px", backgroundColor: i < 2 ? "#1B4332" : "#E2E0DB" }} />}
              </div>
            );
          })}
        </div>

        {/* Overall Progress Bar */}
        <div style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E0DB", padding: "16px 20px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332" }}>Overall Progress</span>
            <span style={{ fontSize: "13px", color: "#6B7280" }}>{totalAnswered} of {totalRequired} questions ({progressPercent}%)</span>
          </div>
          <div style={{ width: "100%", height: "8px", backgroundColor: "#E2E0DB", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{ width: progressPercent + "%", height: "100%", backgroundColor: "#2D6A4F", borderRadius: "4px", transition: "width 0.3s" }} />
          </div>
        </div>

        {/* Section Tabs */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto" }}>
          {SECTIONS.map(function (section, i) {
            var isActive = i === activeSection;
            var prog = sectionProgress[i];
            var isDone = prog.answered === prog.total && prog.total > 0;
            return (
              <button
                key={section.id}
                onClick={function () { setActiveSection(i); }}
                style={{
                  display: "flex", alignItems: "center", gap: "8px",
                  padding: "10px 16px", borderRadius: "10px",
                  backgroundColor: isActive ? "#1B4332" : isDone ? "#ECFDF5" : "white",
                  color: isActive ? "white" : isDone ? "#065F46" : "#6B7280",
                  border: isActive ? "none" : "1px solid " + (isDone ? "#A7F3D0" : "#E2E0DB"),
                  cursor: "pointer", fontSize: "13px", fontWeight: 600,
                  whiteSpace: "nowrap", flexShrink: 0,
                }}
              >
                <section.icon style={{ width: "16px", height: "16px" }} />
                {section.label}
                <span style={{
                  fontSize: "11px", fontWeight: 500,
                  backgroundColor: isActive ? "rgba(255,255,255,0.2)" : isDone ? "#D1FAE5" : "#F3F2EE",
                  padding: "2px 6px", borderRadius: "4px",
                  color: isActive ? "white" : isDone ? "#065F46" : "#9CA3AF",
                }}>{prog.answered}/{prog.total}</span>
              </button>
            );
          })}
        </div>

        {/* Section Content */}
        <motion.div key={activeSection} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3 }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>
            {SECTIONS[activeSection].label}
          </h2>
          <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
            {activeSection === 0 && "Electricity consumption, fuel usage, and renewable energy sources"}
            {activeSection === 1 && "Daily water consumption, source, and recycling"}
            {activeSection === 2 && "Waste generation, disposal method, and raw materials"}
            {activeSection === 3 && "Workforce details, safety records, wages, and benefits"}
            {activeSection === 4 && "Production output, complaints, and buyer-specific questions"}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {currentQuestions.map(function (q, qi) {
              var key = q.field_key || q.id;
              var value = answers[key] !== undefined ? answers[key] : "";

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: qi * 0.03 }}
                  style={{ backgroundColor: "white", borderRadius: "12px", border: "1px solid #E2E0DB", padding: "20px" }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "10px" }}>
                    <label style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332", flex: 1 }}>
                      {q.question || q.text}
                      {q.required !== false && <span style={{ color: "#9B2226" }}> *</span>}
                      {q.unit && <span style={{ fontWeight: 400, color: "#9CA3AF", fontSize: "12px" }}> ({q.unit})</span>}
                    </label>
                    {q.helper && (
                      <div style={{ position: "relative" }}>
                        <button
                          onClick={function () { setShowTooltip(showTooltip === key ? "" : key); }}
                          style={{ background: "none", border: "none", cursor: "pointer", padding: "2px" }}
                        >
                          <HelpCircle style={{ width: "16px", height: "16px", color: "#9CA3AF" }} />
                        </button>
                        {showTooltip === key && (
                          <div style={{
                            position: "absolute", right: 0, top: "24px", width: "250px",
                            backgroundColor: "#1B4332", color: "white", padding: "10px 14px",
                            borderRadius: "8px", fontSize: "12px", lineHeight: 1.5, zIndex: 10,
                            boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                          }}>
                            {q.helper}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {q.input_type === "select" || q.type === "select" ? (
                    <>
                      <select
                        value={value}
                        onChange={function (e) { handleAnswer(key, e.target.value); }}
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border:
                            showErrors && q.required !== false && !value && value !== 0
                              ? "2px solid #EF4444"
                              : "1px solid #E2E0DB",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "white",
                          color: "#1A1A1A",
                          appearance: "none" as const,
                          backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 14px center",
                          paddingRight: "36px",
                        }}
                      >
                        <option value="">Select an option</option>
                        {(q.options || []).map(function (opt: string) {
                          return <option key={opt} value={opt}>{opt}</option>;
                        })}
                      </select>

                      {showErrors && q.required !== false && !value && value !== 0 && (
                        <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
                          This field is required
                        </div>
                      )}
                    </>

                  ) : q.input_type === "number" || q.type === "number" ? (
                    <>
                      <input
                        type="number"
                        value={value}
                        onChange={function (e) { handleAnswer(key, e.target.value); }}
                        placeholder="Enter value"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border:
                            showErrors && q.required !== false && !value && value !== 0
                              ? "2px solid #EF4444"
                              : "1px solid #E2E0DB",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "white",
                          color: "#1A1A1A",
                        }}
                        onFocus={function (e) { e.target.style.borderColor = "#2D6A4F"; }}
                        onBlur={function (e) { e.target.style.borderColor = "#E2E0DB"; }}
                      />

                      {showErrors && q.required !== false && !value && value !== 0 && (
                        <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
                          This field is required
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <input
                        type="text"
                        value={value}
                        onChange={function (e) { handleAnswer(key, e.target.value); }}
                        placeholder="Enter value"
                        style={{
                          width: "100%",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          border:
                            showErrors && q.required !== false && !value && value !== 0
                              ? "2px solid #EF4444"
                              : "1px solid #E2E0DB",
                          fontSize: "14px",
                          outline: "none",
                          backgroundColor: "white",
                          color: "#1A1A1A",
                        }}
                        onFocus={function (e) { e.target.style.borderColor = "#2D6A4F"; }}
                        onBlur={function (e) { e.target.style.borderColor = "#E2E0DB"; }}
                      />

                      {showErrors && q.required !== false && !value && value !== 0 && (
                        <div style={{ fontSize: "12px", color: "#EF4444", marginTop: "4px" }}>
                          This field is required
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={handlePrev} style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: "white", color: "#6B7280", padding: "14px 24px",
            borderRadius: "10px", fontSize: "14px", fontWeight: 500,
            border: "1px solid #E2E0DB", cursor: "pointer",
          }}>
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            {activeSection === 0 ? "Back to Buyer" : "Previous Section"}
          </button>
          <button onClick={handleNext} disabled={saving} style={{
            display: "flex", alignItems: "center", gap: "8px",
            backgroundColor: "#1B4332", color: "white", padding: "14px 32px",
            borderRadius: "10px", fontSize: "15px", fontWeight: 600,
            border: "none", cursor: saving ? "wait" : "pointer",
          }}>
            {saving ? "Submitting..." : activeSection < SECTIONS.length - 1 ? "Next Section" : "Submit & Verify"}
            {!saving && <ArrowRight style={{ width: "18px", height: "18px" }} />}
          </button>
        </div>
      </div>

      <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
    </div>
  );
}
