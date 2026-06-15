"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Leaf, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function LoginPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isSignup, setIsSignup] = useState(searchParams.get("mode") === "signup");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [form, setForm] = useState({ email: "", password: "", name: "" });
    const [forgotMode, setForgotMode] = useState(false);
    const [resetEmail, setResetEmail] = useState("");
    const [resetSent, setResetSent] = useState(false);

    const handleSubmit = async () => {
        setError("");
        setLoading(true);

        try {
            const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
            const body = isSignup
                ? { email: form.email, password: form.password, name: form.name }
                : { email: form.email, password: form.password };

            const res = await fetch(`${API}${endpoint}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.detail || "Something went wrong");
                setLoading(false);
                return;
            }

            // Save token and user info
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            // Redirect new users to onboarding, returning users to dashboard
            if (isSignup) {
                router.push("/onboarding");
            } else {
                router.push("/dashboard");
            }
        } catch (err) {
            setError("Cannot connect to server. Make sure backend is running.");
            setLoading(false);
        }
    };

    const inputStyle = {
        width: "100%",
        padding: "12px 16px 12px 44px",
        borderRadius: "10px",
        border: "1px solid #E2E0DB",
        fontSize: "14px",
        outline: "none",
        backgroundColor: "#FAFAF7",
        color: "#1A1A1A",
        transition: "border-color 0.2s",
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            fontFamily: "var(--font-inter), system-ui, sans-serif"
        }}>
            {/* Left side — Branding */}
            <div className="gradient-hero" style={{
                width: "50%",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "60px",
                position: "relative",
                overflow: "hidden",
            }}>
                {/* Floating orbs */}
                <div className="animate-float" style={{
                    position: "absolute", top: "80px", left: "15%", width: "200px", height: "200px",
                    borderRadius: "50%", background: "radial-gradient(circle, rgba(45,106,79,0.4), transparent)",
                    filter: "blur(50px)", pointerEvents: "none"
                }} />
                <div className="animate-float-slow" style={{
                    position: "absolute", bottom: "80px", right: "10%", width: "180px", height: "180px",
                    borderRadius: "50%", background: "radial-gradient(circle, rgba(212,168,67,0.2), transparent)",
                    filter: "blur(40px)", pointerEvents: "none"
                }} />

                <div style={{ position: "relative", zIndex: 10, textAlign: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", justifyContent: "center", marginBottom: "32px" }}>
                        <Leaf style={{ width: "36px", height: "36px", color: "#D4A843" }} />
                        <span style={{
                            fontSize: "28px", fontWeight: 700, color: "white",
                            fontFamily: "var(--font-heading), system-ui, sans-serif"
                        }}>ESGVerify</span>
                    </div>
                    <h2 style={{
                        fontSize: "32px", fontWeight: 700, color: "white",
                        lineHeight: 1.3, marginBottom: "16px",
                        fontFamily: "var(--font-heading), system-ui, sans-serif"
                    }}>
                        BRSR Compliance<br />
                        <span className="text-gradient-gold">Made Simple</span>
                    </h2>
                    <p style={{ fontSize: "15px", color: "rgba(255,255,255,0.6)", maxWidth: "360px", lineHeight: 1.6 }}>
                        KPIs Scoring. Verification Checks. Fuzzy Logic Scoring. All from your basic business numbers.
                    </p>

                </div>
            </div>

            {/* Right side — Form */}
            <div style={{
                width: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "60px",
                backgroundColor: "#F5F1EB",
            }}>
                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                    style={{ width: "100%", maxWidth: "420px" }}
                >
                    <h1 style={{
                        fontSize: "28px", fontWeight: 700, color: "#1B4332", marginBottom: "8px",
                        fontFamily: "var(--font-heading), system-ui, sans-serif"
                    }}>
                        {isSignup ? "Create your account" : "Welcome"}
                    </h1>
                    <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "32px" }}>
                        {isSignup
                            ? "Start your ESG compliance journey today"
                            : "Log in to continue your assessment"}
                    </p>

                    {/* Forgot Password Modal */}
                    {forgotMode && (
                        <div style={{
                            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
                            backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
                            justifyContent: "center", zIndex: 100,
                        }}>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                style={{
                                    backgroundColor: "white", borderRadius: "16px", padding: "32px",
                                    width: "400px", maxWidth: "90vw",
                                }}
                            >
                                {!resetSent ? (
                                    <>
                                        <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1B4332", marginBottom: "8px" }}>Reset Password</h3>
                                        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
                                            Enter your email address and we will send you a password reset link.
                                        </p>
                                        <div style={{ position: "relative", marginBottom: "16px" }}>
                                            <Mail style={{
                                                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                                                width: "18px", height: "18px", color: "#9CA3AF"
                                            }} />
                                            <input
                                                type="email"
                                                placeholder="Email address"
                                                value={resetEmail}
                                                onChange={function (e) { setResetEmail(e.target.value); }}
                                                style={inputStyle}
                                                onFocus={function (e) { e.target.style.borderColor = "#2D6A4F"; }}
                                                onBlur={function (e) { e.target.style.borderColor = "#E2E0DB"; }}
                                            />
                                        </div>
                                        <div style={{ display: "flex", gap: "10px" }}>
                                            <button
                                                onClick={function () { setResetSent(true); }}
                                                disabled={!resetEmail}
                                                style={{
                                                    flex: 1, padding: "12px", borderRadius: "10px",
                                                    backgroundColor: resetEmail ? "#1B4332" : "#9CA3AF",
                                                    color: "white", fontSize: "14px", fontWeight: 600,
                                                    border: "none", cursor: resetEmail ? "pointer" : "not-allowed",
                                                }}
                                            >
                                                Send Reset Link
                                            </button>
                                            <button
                                                onClick={function () { setForgotMode(false); setResetEmail(""); setResetSent(false); }}
                                                style={{
                                                    padding: "12px 20px", borderRadius: "10px",
                                                    backgroundColor: "white", color: "#6B7280", fontSize: "14px",
                                                    fontWeight: 500, border: "1px solid #E2E0DB", cursor: "pointer",
                                                }}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div style={{ textAlign: "center" }}>
                                            <div style={{
                                                width: "48px", height: "48px", borderRadius: "50%",
                                                backgroundColor: "#E8F5E9", display: "flex", alignItems: "center",
                                                justifyContent: "center", margin: "0 auto 16px",
                                            }}>
                                                <Mail style={{ width: "22px", height: "22px", color: "#2D6A4F" }} />
                                            </div>
                                            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#1B4332", marginBottom: "8px" }}>Check your email</h3>
                                            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
                                                If an account exists for {resetEmail}, you will receive a password reset link shortly.
                                            </p>
                                            <button
                                                onClick={function () { setForgotMode(false); setResetEmail(""); setResetSent(false); }}
                                                style={{
                                                    padding: "12px 32px", borderRadius: "10px",
                                                    backgroundColor: "#1B4332", color: "white", fontSize: "14px",
                                                    fontWeight: 600, border: "none", cursor: "pointer",
                                                }}
                                            >
                                                Back to Login
                                            </button>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div style={{
                            backgroundColor: "#FEE2E2", color: "#9B2226", padding: "10px 16px",
                            borderRadius: "8px", fontSize: "13px", marginBottom: "16px",
                            border: "1px solid #FECACA"
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        {/* Name field (signup only) */}
                        {isSignup && (
                            <div style={{ position: "relative" }}>
                                <User style={{
                                    position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                                    width: "18px", height: "18px", color: "#9CA3AF"
                                }} />
                                <input
                                    type="text"
                                    placeholder="Full Name"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    style={inputStyle}
                                    onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                    onBlur={(e) => e.target.style.borderColor = "#E2E0DB"}
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div style={{ position: "relative" }}>
                            <Mail style={{
                                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                                width: "18px", height: "18px", color: "#9CA3AF"
                            }} />
                            <input
                                type="email"
                                placeholder="Email address"
                                value={form.email}
                                onChange={(e) => setForm({ ...form, email: e.target.value })}
                                style={inputStyle}
                                onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                onBlur={(e) => e.target.style.borderColor = "#E2E0DB"}
                            />
                        </div>

                        {/* Password */}
                        <div style={{ position: "relative" }}>
                            <Lock style={{
                                position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                                width: "18px", height: "18px", color: "#9CA3AF"
                            }} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={form.password}
                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                style={{ ...inputStyle, paddingRight: "44px" }}
                                onFocus={(e) => e.target.style.borderColor = "#2D6A4F"}
                                onBlur={(e) => e.target.style.borderColor = "#E2E0DB"}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: "absolute", right: "14px", top: "50%", transform: "translateY(-50%)",
                                    background: "none", border: "none", cursor: "pointer", padding: 0
                                }}
                            >
                                {showPassword
                                    ? <EyeOff style={{ width: "18px", height: "18px", color: "#9CA3AF" }} />
                                    : <Eye style={{ width: "18px", height: "18px", color: "#9CA3AF" }} />
                                }
                            </button>
                        </div>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={loading || !form.email || !form.password || (isSignup && !form.name)}
                            style={{
                                width: "100%", padding: "14px", borderRadius: "10px",
                                backgroundColor: (!form.email || !form.password || (isSignup && !form.name)) ? "#9CA3AF" : "#1B4332",
                                color: "white", fontSize: "15px", fontWeight: 600,
                                border: "none", cursor: loading ? "wait" : "pointer",
                                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                                transition: "background-color 0.2s",
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? "Please wait..." : (isSignup ? "Create Account" : "Log In")}
                            {!loading && <ArrowRight style={{ width: "18px", height: "18px" }} />}
                        </button>
                    </div>


                    {/* Forgot Password */}
                    {!isSignup && (
                        <div style={{ textAlign: "right", marginTop: "8px" }}>
                            <button
                                onClick={function () { setForgotMode(true); }}
                                style={{ background: "none", border: "none", color: "#D4A843", fontSize: "13px", fontWeight: 500, cursor: "pointer" }}
                            >
                                Forgot password?
                            </button>
                        </div>
                    )}

                    {/* Toggle */}
                    <p style={{ textAlign: "center", fontSize: "14px", color: "#6B7280", marginTop: "24px" }}>
                        {isSignup ? "Already have an account? " : "Don't have an account? "}
                        <button
                            onClick={() => { setIsSignup(!isSignup); setError(""); }}
                            style={{
                                background: "none", border: "none", color: "#D4A843",
                                fontWeight: 600, cursor: "pointer", fontSize: "14px"
                            }}
                        >
                            {isSignup ? "Log in" : "Sign up"}
                        </button>
                    </p>

                    {/* Back to home */}
                    <div style={{ textAlign: "center", marginTop: "16px" }}>
                        <Link href="/" style={{ fontSize: "13px", color: "#9CA3AF", textDecoration: "none" }}>
                            ← Back to home
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}