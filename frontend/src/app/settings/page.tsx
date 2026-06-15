"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Leaf, ArrowLeft, Database, Zap, Flame, MapPin, Clock, Info } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SettingsPage() {
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(function () {
        fetch(API + "/api/settings/regulatory")
            .then(function (res) { return res.json(); })
            .then(function (d) { setData(d); setLoading(false); })
            .catch(function () { setLoading(false); });
    }, []);

    if (loading) {
        return (
            <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#F5F1EB" }}>
                <p style={{ color: "#6B7280" }}>Loading regulatory data...</p>
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
                    <button onClick={function () { router.push("/dashboard"); }} style={{ fontSize: "13px", color: "#6B7280", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
                        <ArrowLeft style={{ width: "16px", height: "16px" }} /> Dashboard
                    </button>
                </div>
            </nav>

            <div style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px" }}>
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
                    <h1 style={{ fontSize: "24px", fontWeight: 700, color: "#1B4332", marginBottom: "6px" }}>Regulatory Settings</h1>
                    <p style={{ fontSize: "14px", color: "#6B7280", marginBottom: "28px" }}>
                        All values used in ESG calculations. Sourced from official Indian and international regulatory bodies.
                    </p>
                </motion.div>

                {/* Info banner */}
                <div style={{ display: "flex", alignItems: "start", gap: "10px", backgroundColor: "#E8F5E9", borderRadius: "12px", padding: "14px 18px", marginBottom: "24px", border: "1px solid #A7F3D0" }}>
                    <Info style={{ width: "18px", height: "18px", color: "#2D6A4F", flexShrink: 0, marginTop: "1px" }} />
                    <p style={{ fontSize: "13px", color: "#065F46", lineHeight: 1.6 }}>
                        These values are updated when the government publishes new notifications. The fuzzy logic engine uses ratios (not absolute values), so calculations automatically adjust when thresholds are updated.
                    </p>
                </div>

                {/* Grid Emission Factor */}
                {data?.cea_grid_factor && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#E8F5E9", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Zap style={{ width: "18px", height: "18px", color: "#2D6A4F" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B4332" }}>Grid Emission Factor</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>{data.cea_grid_factor.source}</div>
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                            <span style={{ fontSize: "32px", fontWeight: 800, color: "#1B4332" }}>{data.cea_grid_factor.value}</span>
                            <span style={{ fontSize: "14px", color: "#6B7280" }}>{data.cea_grid_factor.unit}</span>
                        </div>
                    </motion.div>
                )}

                {/* BEE + Standard Hours */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
                    {data?.kwh_to_gj && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px" }}>
                            <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B4332", marginBottom: "4px" }}>Energy Conversion</div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "12px" }}>{data.kwh_to_gj.source}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                <span style={{ fontSize: "28px", fontWeight: 800, color: "#2D6A4F" }}>{data.kwh_to_gj.value}</span>
                                <span style={{ fontSize: "12px", color: "#6B7280" }}>{data.kwh_to_gj.unit}</span>
                            </div>
                        </motion.div>
                    )}
                    {data?.std_hours && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                                <Clock style={{ width: "14px", height: "14px", color: "#1B4332" }} />
                                <span style={{ fontSize: "13px", fontWeight: 600, color: "#1B4332" }}>Standard Working Hours</span>
                            </div>
                            <div style={{ fontSize: "11px", color: "#9CA3AF", marginBottom: "12px" }}>{data.std_hours.source}</div>
                            <div style={{ display: "flex", alignItems: "baseline", gap: "6px" }}>
                                <span style={{ fontSize: "28px", fontWeight: 800, color: "#2D6A4F" }}>{data.std_hours.value.toLocaleString()}</span>
                                <span style={{ fontSize: "12px", color: "#6B7280" }}>{data.std_hours.unit}</span>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Fuel Factors */}
                {data?.fuel_factors && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px", marginBottom: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#FFF8E1", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <Flame style={{ width: "18px", height: "18px", color: "#B8860B" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B4332" }}>IPCC Fuel Emission Factors</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>IPCC 2006 Guidelines</div>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
                            {Object.entries(data.fuel_factors).map(function (entry) {
                                var name = entry[0] as string;
                                var info = entry[1] as any;
                                return (
                                    <div key={name} style={{ backgroundColor: "#FAFAF7", borderRadius: "10px", padding: "14px" }}>
                                        <div style={{ fontSize: "13px", fontWeight: 600, color: "#1B4332", textTransform: "capitalize", marginBottom: "8px" }}>
                                            {name === "natgas" ? "Natural Gas" : name === "furnaceoil" ? "Furnace Oil" : name}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#6B7280", marginBottom: "2px" }}>
                                            CO2: <strong style={{ color: "#1B4332" }}>{info.co2}</strong> kg/{info.unit}
                                        </div>
                                        <div style={{ fontSize: "12px", color: "#6B7280" }}>
                                            Energy: <strong style={{ color: "#1B4332" }}>{info.gj}</strong> GJ/{info.unit}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}

                {/* State Minimum Wages */}
                {data?.state_min_wages && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ backgroundColor: "white", borderRadius: "14px", border: "1px solid #E2E0DB", padding: "20px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#EDE9FE", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                <MapPin style={{ width: "18px", height: "18px", color: "#6D28D9" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "15px", fontWeight: 600, color: "#1B4332" }}>State Minimum Wages</div>
                                <div style={{ fontSize: "12px", color: "#9CA3AF" }}>Ministry of Labour 2024-25</div>
                            </div>
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px" }}>
                            {Object.entries(data.state_min_wages).sort(function (a: any, b: any) { return b[1].value - a[1].value; }).map(function (entry) {
                                var state = entry[0] as string;
                                var info = entry[1] as any;
                                var maxWage = 420;
                                var pct = (info.value / maxWage) * 100;
                                return (
                                    <div key={state} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 0" }}>
                                        <span style={{ fontSize: "12px", color: "#4B5563", width: "120px", flexShrink: 0 }}>{state}</span>
                                        <div style={{ flex: 1, height: "6px", backgroundColor: "#F3F2EE", borderRadius: "3px", overflow: "hidden" }}>
                                            <div style={{ width: pct + "%", height: "100%", backgroundColor: "#2D6A4F", borderRadius: "3px" }} />
                                        </div>
                                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#1B4332", width: "60px", textAlign: "right" }}>Rs {info.value}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}