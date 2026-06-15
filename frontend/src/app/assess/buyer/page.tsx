"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Leaf, ArrowRight, ArrowLeft, Search, Globe, FileText, AlertTriangle, CheckCircle2, Loader2, ChevronDown, ChevronUp, ExternalLink, Info } from "lucide-react";
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function BuyerAnalysisPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyData, setCompanyData] = useState<Record<string, string>>({});
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [searchResults, setSearchResults] = useState<Array<{ title: string; snippet: string; link: string }>>([]);
  const [showSources, setShowSources] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!assessmentId) return;
    const token = localStorage.getItem("token");
    if (!token) return;

    fetch(API + "/api/assessments/" + assessmentId, {
      headers: { Authorization: "Bearer " + token },
    })
      .then(function (res) { return res.json(); })
      .then(async function (data) {
        const cd = data.assessment?.company_data;
        if (!cd || !cd.buyer_name) {
          router.push("/assess/company?id=" + assessmentId);
          return;
        }
        setCompanyData(cd);

        if (data.assessment?.buyer_summary && Object.keys(data.assessment.buyer_summary).length > 0) {
          setSummary(data.assessment.buyer_summary);
          setSearchResults(data.assessment.buyer_search || []);
          setLoading(false);
          return;
        }

        try {
          const buyerRes = await fetch(API + "/api/summarize-buyer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ buyer_name: cd.buyer_name, industry: cd.industry }),
          });
          const buyerData = await buyerRes.json();
          setSummary(buyerData.summary || {});
          setSearchResults(buyerData.search_results || []);

          await fetch(API + "/api/assessments/" + assessmentId, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ buyer_summary: buyerData.summary || {}, buyer_search: buyerData.search_results || [] }),
          });
        } catch (err) {
          setError("Failed to fetch buyer requirements. You can still continue.");
        }
        setLoading(false);
      })
      .catch(function () {
        setError("Failed to load assessment");
        setLoading(false);
      });
  }, [assessmentId, router]);

  const handleNext = async function () {
    setSaving(true);
    const token = localStorage.getItem("token");
    try {
      await fetch(API + "/api/assessments/" + assessmentId, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ step: 3 }),
      });
      router.push("/assess/data?id=" + assessmentId);
    } catch (err) {
      setSaving(false);
    }
  };

  const sectionList = [
    { key: "requirements_summary", title: "What They Require", color: "#1B4332" },
    { key: "relevance_to_msme", title: "Relevance to Your MSME", color: "#2D6A4F" },
    { key: "what_msme_should_do", title: "What You Should Do", color: "#D4A843" },
    { key: "supplier_compliance", title: "Supplier Compliance Process", color: "#1B4332" },
    { key: "key_points_to_note", title: "Key Points to Note", color: "#9B2226" },
  ];

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
        <div style={{ width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "#1B4332", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px" }}>
          <Search style={{ width: "24px", height: "24px", color: "white" }} />
        </div>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1B4332", marginBottom: "8px" }}>
          Searching for {companyData.buyer_name || "buyer"} requirements...
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280" }}>Fetching live ESG requirements from the web</p>
      </div>
    );
  }

  const hasSummary = summary && Object.keys(summary).length > 0;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
      <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
            <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332" }}>ESGVerify</span>
          </div>
          <button onClick={function () { router.push("/assess/company?id=" + assessmentId); }} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <ArrowLeft style={{ width: "16px", height: "16px" }} /> Back
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: "800px", margin: "0 auto", padding: "32px 24px" }}>
        {/* Progress */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
          {["Company", "Buyer", "Data Entry", "Verify", "Results"].map(function (step, i) {
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flex: i < 4 ? 1 : undefined }}>
                <div style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: i <= 1 ? "#1B4332" : "#E2E0DB", color: i <= 1 ? "white" : "#9CA3AF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, flexShrink: 0 }}>
                  {i < 1 ? "\u2713" : i + 1}
                </div>
                <span style={{ fontSize: "12px", color: i <= 1 ? "#1B4332" : "#9CA3AF", fontWeight: i === 1 ? 600 : 400 }}>{step}</span>
                {i < 4 && <div style={{ flex: 1, height: "2px", backgroundColor: i < 1 ? "#1B4332" : "#E2E0DB" }} />}
              </div>
            );
          })}
        </div>

        {/* Title */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>
            Buyer Analysis: {companyData.buyer_name}
          </h1>
          <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
            Live ESG requirements fetched from the web for {companyData.buyer_name}. Review what your buyer expects.
          </p>
        </motion.div>

        {/* Error */}
        {error && (
          <div style={{ backgroundColor: "#FEF9EE", border: "1px solid #F3D9A4", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", fontSize: "13px", color: "#92400E", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle style={{ width: "16px", height: "16px", flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* No data fallback */}
        {!hasSummary ? (
          <div style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "40px", textAlign: "center" }}>
            <Search style={{ width: "36px", height: "36px", color: "#D1D5DB", margin: "0 auto 16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1B4332", marginBottom: "8px" }}>
              No specific ESG data found for {companyData.buyer_name}
            </h3>
            <p style={{ fontSize: "14px", color: "#6B7280" }}>
              Applying standard BRSR Core benchmarks for {companyData.industry}. You can still proceed.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {sectionList.map(function (section, i) {
              const content = summary[section.key] || summary["key_thresholds"] || "";
              if (!content && section.key !== "key_points_to_note") return null;
              if (!content) return null;

              return (
                <motion.div
                  key={section.key}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", borderLeft: "4px solid " + section.color, overflow: "hidden" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "20px 24px", borderBottom: "1px solid #F3F2EE" }}>
                    <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: section.color + "15", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FileText style={{ width: "18px", height: "18px", color: section.color }} />
                    </div>
                    <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1B4332" }}>{section.title}</h3>
                  </div>
                  <div style={{ padding: "20px 24px" }}>
                    {Array.isArray(content) ? (
                      <ul style={{ margin: 0, paddingLeft: "20px", listStyleType: "disc" }}>
                        {content.map(function (point, idx) {
                          return (
                            <li key={idx} style={{ fontSize: "15px", color: "#4B5563", lineHeight: 1.8, marginBottom: "8px" }}>
                              {point}
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p style={{ fontSize: "15px", color: "#4B5563", lineHeight: 1.8, whiteSpace: "pre-wrap" }}>{content}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Source Documents */}
        {searchResults.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <button onClick={function () { setShowSources(!showSources); }} style={{ display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>
              {showSources ? <ChevronUp style={{ width: "16px", height: "16px" }} /> : <ChevronDown style={{ width: "16px", height: "16px" }} />}
              {showSources ? "Hide" : "Show"} {searchResults.length} source documents
            </button>

            {showSources && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                {searchResults.map(function (result, i) {
                  if (!result.link) {
                    return (
                      <div key={i} style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E0DB", padding: "12px 16px", display: "flex", alignItems: "start", gap: "10px" }}>
                        <Info style={{ width: "14px", height: "14px", color: "#9CA3AF", marginTop: "2px", flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: "14px", fontWeight: 600, color: "#1B4332", marginBottom: "4px" }}>{result.title}</div>
                          <div style={{ fontSize: "13px", color: "#6B7280", lineHeight: 1.5 }}>{result.snippet}</div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <a key={i} href={result.link} target="_blank" rel="noopener noreferrer" style={{ backgroundColor: "white", borderRadius: "10px", border: "1px solid #E2E0DB", padding: "12px 16px", textDecoration: "none", display: "flex", alignItems: "start", gap: "10px" }}>
                      <ExternalLink style={{ width: "14px", height: "14px", color: "#9CA3AF", marginTop: "2px", flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B4332", marginBottom: "4px" }}>{result.title}</div>
                        <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.5 }}>{result.snippet}</div>
                      </div>
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "32px" }}>
          <button onClick={function () { router.push("/assess/company?id=" + assessmentId); }} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "white", color: "#6B7280", padding: "14px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: 500, border: "1px solid #E2E0DB", cursor: "pointer" }}>
            <ArrowLeft style={{ width: "16px", height: "16px" }} />
            Back
          </button>
          <button onClick={handleNext} disabled={saving} style={{ display: "flex", alignItems: "center", gap: "8px", backgroundColor: "#1B4332", color: "white", padding: "14px 32px", borderRadius: "10px", fontSize: "15px", fontWeight: 600, border: "none", cursor: saving ? "wait" : "pointer" }}>
            {saving ? "Saving..." : "Continue to Data Entry"}
            {!saving && <ArrowRight style={{ width: "18px", height: "18px" }} />}
          </button>
        </div>
      </div>
    </div>
  );
}
