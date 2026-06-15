"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import {
    Leaf, Building2, MapPin, Factory, Users, ShoppingBag,
    CreditCard, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CompanyInfoPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const assessmentId = searchParams.get("id");

    const [industries, setIndustries] = useState<string[]>([]);
    const [states, setStates] = useState<string[]>([]);
    const [buyers, setBuyers] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        company_name: "",
        gstin: "",
        industry: "",
        custom_industry: "",
        state: "",
        city: "",
        workers: "",
        buyer_name: "",
        custom_buyer: "",
    });

    const [validation, setValidation] = useState({
        gstin: { status: "", message: "" },
        city: { status: "", message: "" },
    });

    // Load dropdown data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [indRes, stRes, buyRes] = await Promise.all([
                    fetch(`${API}/api/industries`),
                    fetch(`${API}/api/states`),
                    fetch(`${API}/api/buyers`),
                ]);
                const indData = await indRes.json();
                const stData = await stRes.json();
                const buyData = await buyRes.json();
                setIndustries([...indData.industries, "Other (type below)"]);
                setStates(stData.states);
                setBuyers([...buyData.buyers, "Other (type below)"]);
            } catch (err) {
                console.error("Failed to load dropdown data");
            }
        };
        fetchData();
    }, []);

    // Load saved data if resuming
    useEffect(() => {
        if (!assessmentId) return;
        const token = localStorage.getItem("token");
        fetch(`${API}/api/assessments/${assessmentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        })
            .then(res => res.json())
            .then(data => {
                if (data.assessment?.company_data && Object.keys(data.assessment.company_data).length > 0) {
                    const cd = data.assessment.company_data;
                    setForm({
                        company_name: cd.company_name || cd.name || "",
                        gstin: cd.gstin || "",
                        industry: cd.industry || "",
                        custom_industry: cd.custom_industry || "",
                        state: cd.state || "",
                        city: cd.city || "",
                        workers: cd.workers?.toString() || "",
                        buyer_name: cd.buyer_name || "",
                        custom_buyer: cd.custom_buyer || "",
                    });
                }
            })
            .catch(() => { });
    }, [assessmentId]);

    // Validate GSTIN
    const validateGstin = async (gstin: string) => {
        if (gstin.length < 15) {
            setValidation(v => ({
                ...v,
                gstin: gstin.length === 0
                    ? { status: "", message: "" }
                    : { status: "error", message: `GSTIN must be 15 characters (you entered ${gstin.length})` }
            }));
            return;
        }
        try {
            const res = await fetch(`${API}/api/validate-gstin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gstin }),
            });
            const data = await res.json();
            setValidation(v => ({ ...v, gstin: { status: data.status, message: data.message } }));

            // Also check state match if state is selected
            if (form.state && data.status === "pass") {
                const stRes = await fetch(`${API}/api/verify-gstin-state`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gstin, state: form.state }),
                });
                const stData = await stRes.json();
                if (stData.status === "fail") {
                    setValidation(v => ({ ...v, gstin: { status: "fail", message: stData.message } }));
                }
            }
        } catch (err) {
            setValidation(v => ({ ...v, gstin: { status: "error", message: "Cannot validate — server unavailable" } }));
        }
    };

    // Validate city-state
    const validateCity = async (city: string, state: string) => {
        if (!city || !state) return;
        try {
            const res = await fetch(`${API}/api/validate-city-state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ city, state }),
            });
            const data = await res.json();
            setValidation(v => ({ ...v, city: { status: data.status, message: data.message } }));
        } catch (err) {
            setValidation(v => ({ ...v, city: { status: "", message: "" } }));
        }
    };

    const handleChange = (field: string, value: string) => {
        const newForm = { ...form, [field]: value };
        setForm(newForm);

        if (field === "gstin") validateGstin(value.toUpperCase());
        if (field === "city") validateCity(value, newForm.state);
        if (field === "state") {
            if (newForm.city) validateCity(newForm.city, value);
            // Re-validate GSTIN state match when state changes
            if (newForm.gstin.length === 15) {
                revalidateGstinWithState(newForm.gstin, value);
            }
        }
    };

    const revalidateGstinWithState = async (gstin: string, state: string) => {
        try {
            const res = await fetch(`${API}/api/validate-gstin`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ gstin }),
            });
            const data = await res.json();

            if (data.status === "pass" && state) {
                const stRes = await fetch(`${API}/api/verify-gstin-state`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ gstin, state }),
                });
                const stData = await stRes.json();
                if (stData.status === "fail") {
                    setValidation(v => ({ ...v, gstin: { status: "fail", message: stData.message } }));
                } else {
                    setValidation(v => ({ ...v, gstin: { status: "pass", message: data.message } }));
                }
            } else {
                setValidation(v => ({ ...v, gstin: { status: data.status, message: data.message } }));
            }
        } catch (err) {
            setValidation(v => ({ ...v, gstin: { status: "error", message: "Cannot validate" } }));
        }
    };

    const getIndustry = () => form.industry === "Other (type below)" ? form.custom_industry : form.industry;
    const getBuyer = () => form.buyer_name === "Other (type below)" ? form.custom_buyer : form.buyer_name;

    const isValid = () => {
        const hasName = form.company_name.trim().length > 0;
        const gstinOk = form.gstin.length === 15 && validation.gstin.status === "pass";
        const hasIndustry = getIndustry().length > 0;
        const hasState = form.state.length > 0;
        const cityOk = form.city.trim().length > 0 && validation.city.status !== "fail";
        const hasWorkers = form.workers.length > 0 && parseInt(form.workers) > 0;
        const hasBuyer = getBuyer().length > 0;

        return hasName && gstinOk && hasIndustry && hasState && cityOk && hasWorkers && hasBuyer;
    };

    const handleNext = async () => {
        if (!isValid() || !assessmentId) return;
        setLoading(true);

        const companyData = {
            company_name: form.company_name,
            name: form.company_name,
            gstin: form.gstin.toUpperCase(),
            industry: getIndustry(),
            state: form.state,
            city: form.city,
            workers: parseInt(form.workers),
            buyer_name: getBuyer(),
        };

        const token = localStorage.getItem("token");
        try {
            await fetch(`${API}/api/assessments/${assessmentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ company_data: companyData, step: 2 }),
            });
            router.push(`/assess/buyer?id=${assessmentId}`);
        } catch (err) {
            console.error("Failed to save");
            setLoading(false);
        }
    };

    const getValidationIcon = (status: string) => {
        if (status === "pass") return <CheckCircle2 style={{ width: "16px", height: "16px", color: "#2D6A4F" }} />;
        if (status === "warn") return <AlertCircle style={{ width: "16px", height: "16px", color: "#B8860B" }} />;
        if (status === "error" || status === "fail") return <AlertCircle style={{ width: "16px", height: "16px", color: "#9B2226" }} />;
        return null;
    };

    const getValidationColor = (status: string) => {
        if (status === "pass") return "#2D6A4F";
        if (status === "warn") return "#B8860B";
        return "#9B2226";
    };

    const inputStyle = (hasError?: boolean) => ({
        width: "100%",
        padding: "12px 16px",
        borderRadius: "10px",
        border: `1px solid ${hasError ? "#FCA5A5" : "#E2E0DB"}`,
        fontSize: "14px",
        outline: "none",
        backgroundColor: "white",
        color: "#1A1A1A",
        transition: "border-color 0.2s",
    });

    const selectStyle = {
        ...inputStyle(),
        appearance: "none" as const,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%239CA3AF' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 14px center",
        paddingRight: "36px",
    };

    const labelStyle = {
        display: "block",
        fontSize: "13px",
        fontWeight: 600 as const,
        color: "#1B4332",
        marginBottom: "6px",
    };

    return (
        <div style={{ minHeight: "100vh", backgroundColor: "#F5F1EB", fontFamily: "var(--font-inter), system-ui, sans-serif" }}>
            {/* Nav */}
            <nav style={{ backgroundColor: "white", borderBottom: "1px solid #E2E0DB", position: "sticky", top: 0, zIndex: 40 }}>
                <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 24px", height: "64px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Leaf style={{ width: "24px", height: "24px", color: "#1B4332" }} />
                        <span style={{ fontSize: "18px", fontWeight: 700, color: "#1B4332", fontFamily: "var(--font-heading)" }}>ESGVerify</span>
                    </div>
                    <button onClick={() => router.push("/dashboard")} style={{
                        fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer",
                        display: "flex", alignItems: "center", gap: "6px"
                    }}>
                        <ArrowLeft style={{ width: "16px", height: "16px" }} /> Dashboard
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: "700px", margin: "0 auto", padding: "32px 24px" }}>
                {/* Progress */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "32px" }}>
                    {["Company", "Buyer", "Data Entry", "Verify", "Results"].map((step, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", flex: i < 4 ? 1 : "none" }}>
                            <div style={{
                                width: "28px", height: "28px", borderRadius: "50%",
                                backgroundColor: i === 0 ? "#1B4332" : "#E2E0DB",
                                color: i === 0 ? "white" : "#9CA3AF",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                fontSize: "12px", fontWeight: 600, flexShrink: 0
                            }}>{i + 1}</div>
                            <span style={{ fontSize: "12px", color: i === 0 ? "#1B4332" : "#9CA3AF", fontWeight: i === 0 ? 600 : 400 }}>{step}</span>
                            {i < 4 && <div style={{ flex: 1, height: "2px", backgroundColor: "#E2E0DB" }} />}
                        </div>
                    ))}
                </div>

                {/* Title */}
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1B4332", marginBottom: "6px", fontFamily: "var(--font-heading)" }}>
                        Company Information
                    </h1>
                    <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
                        Tell us about your business. All fields marked with * are required.
                    </p>
                </motion.div>

                {/* Form */}
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ backgroundColor: "white", borderRadius: "16px", border: "1px solid #E2E0DB", padding: "28px" }}
                >
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                        {/* Company Name */}
                        <div>
                            <label style={labelStyle}><Building2 style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Company Name *</label>
                            <input
                                type="text"
                                placeholder="e.g., Lakshmi Textiles Pvt Ltd"
                                value={form.company_name}
                                onChange={(e) => handleChange("company_name", e.target.value)}
                                style={inputStyle()}
                                onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                onBlur={(e) => e.target.style.borderColor = "#E2E0DB"}
                            />
                        </div>

                        {/* GSTIN */}
                        <div>
                            <label style={labelStyle}><CreditCard style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />GSTIN *</label>
                            <input
                                type="text"
                                placeholder="e.g., 33AABCL1234M1ZQ"
                                value={form.gstin}
                                onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
                                maxLength={15}
                                style={inputStyle(validation.gstin.status === "error" || validation.gstin.status === "fail")}
                                onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                onBlur={(e) => e.target.style.borderColor = (validation.gstin.status === "error" || validation.gstin.status === "fail") ? "#FCA5A5" : "#E2E0DB"}
                            />
                            {validation.gstin.message && (
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: getValidationColor(validation.gstin.status) }}>
                                    {getValidationIcon(validation.gstin.status)}
                                    {validation.gstin.message}
                                </div>
                            )}
                        </div>

                        {/* Industry + State (2 columns) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}><Factory style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Industry *</label>
                                <select
                                    value={form.industry}
                                    onChange={(e) => handleChange("industry", e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">Select industry</option>
                                    {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                                </select>
                                {form.industry === "Other (type below)" && (
                                    <input
                                        type="text"
                                        placeholder="Enter your industry"
                                        value={form.custom_industry}
                                        onChange={(e) => handleChange("custom_industry", e.target.value)}
                                        style={{ ...inputStyle(), marginTop: "8px" }}
                                    />
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}><MapPin style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />State *</label>
                                <select
                                    value={form.state}
                                    onChange={(e) => handleChange("state", e.target.value)}
                                    style={selectStyle}
                                >
                                    <option value="">Select state</option>
                                    {states.map(st => <option key={st} value={st}>{st}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* City + Workers (2 columns) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                            <div>
                                <label style={labelStyle}><MapPin style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />City *</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Tirupur"
                                    value={form.city}
                                    onChange={(e) => handleChange("city", e.target.value)}
                                    style={inputStyle(validation.city.status === "fail")}
                                    onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                    onBlur={(e) => e.target.style.borderColor = validation.city.status === "fail" ? "#FCA5A5" : "#E2E0DB"}
                                />
                                {validation.city.message && (
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "6px", fontSize: "12px", color: getValidationColor(validation.city.status) }}>
                                        {getValidationIcon(validation.city.status)}
                                        {validation.city.message}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label style={labelStyle}><Users style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Total Workers *</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 120"
                                    value={form.workers}
                                    onChange={(e) => handleChange("workers", e.target.value)}
                                    min="1"
                                    style={inputStyle()}
                                    onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                    onBlur={(e) => e.target.style.borderColor = "#E2E0DB"}
                                />
                            </div>
                        </div>

                        {/* Buyer */}
                        <div>
                            <label style={labelStyle}><ShoppingBag style={{ width: "14px", height: "14px", display: "inline", marginRight: "6px", verticalAlign: "middle" }} />Target Buyer *</label>
                            <select
                                value={form.buyer_name}
                                onChange={(e) => handleChange("buyer_name", e.target.value)}
                                style={selectStyle}
                            >
                                <option value="">Select your target buyer</option>
                                {buyers.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            {form.buyer_name === "Other (type below)" && (
                                <input
                                    type="text"
                                    placeholder="Enter buyer name"
                                    value={form.custom_buyer}
                                    onChange={(e) => handleChange("custom_buyer", e.target.value)}
                                    style={{ ...inputStyle(), marginTop: "8px" }}
                                />
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Validation Summary */}
                {(form.gstin.length === 15 || form.city.trim().length > 0) && (
                    <div style={{
                        marginTop: "16px", padding: "12px 16px", borderRadius: "10px",
                        backgroundColor: isValid() ? "#ECFDF5" : "#FEF9EE",
                        border: `1px solid ${isValid() ? "#A7F3D0" : "#F3D9A4"}`,
                        fontSize: "13px", color: isValid() ? "#065F46" : "#92400E"
                    }}>
                        {isValid()
                            ? "✓ All validations passed. You can proceed."
                            : "Please fix the issues above before continuing. GSTIN must match the selected state."
                        }
                    </div>
                )}

                {/* Next Button */}
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "24px" }}>
                    <button
                        onClick={handleNext}
                        disabled={!isValid() || loading}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            backgroundColor: isValid() && !loading ? "#1B4332" : "#9CA3AF",
                            color: "white", padding: "14px 32px", borderRadius: "10px",
                            fontSize: "15px", fontWeight: 600, border: "none",
                            cursor: isValid() && !loading ? "pointer" : "not-allowed",
                            transition: "background-color 0.2s"
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 style={{ width: "18px", height: "18px", animation: "spin 1s linear infinite" }} />
                                Saving...
                            </>
                        ) : (
                            <>
                                Continue to Buyer Analysis
                                <ArrowRight style={{ width: "18px", height: "18px" }} />
                            </>
                        )}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}