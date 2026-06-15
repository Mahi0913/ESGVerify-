"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Leaf, User } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
    role: string;
    content: string;
}

var defaultQuestions = [
    "What is ESG?",
    "How to calculate carbon footprint?",
    "What is recycled water?",
    "What is LTIFR?",
    "What is GSTIN?",
    "What does BRSR mean?",
];

export default function HelpBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        { role: "assistant", content: "Hi! I am your ESG assistant. Ask me anything about ESG, BRSR, or how to fill the assessment. I will explain in simple language." }
    ]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(function () {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    async function handleSend(question?: string) {
        var q = question || input.trim();
        if (!q || loading) return;

        var newMessages = messages.concat([{ role: "user", content: q }]);
        setMessages(newMessages);
        setInput("");
        setLoading(true);

        try {
            var res = await fetch(API + "/api/help-bot", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ question: q }),
            });
            var data = await res.json();
            setMessages(newMessages.concat([{ role: "assistant", content: data.answer || "Sorry, I could not find an answer. Please try rephrasing your question." }]));
        } catch (err) {
            setMessages(newMessages.concat([{ role: "assistant", content: "I am having trouble connecting to the server. Please make sure the backend is running." }]));
        }
        setLoading(false);
    }

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={function () { setIsOpen(!isOpen); }}
                style={{
                    position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
                    width: "56px", height: "56px", borderRadius: "50%",
                    backgroundColor: "#1B4332", color: "white", border: "none",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", boxShadow: "0 4px 20px rgba(27,67,50,0.3)",
                }}
            >
                {isOpen
                    ? <X style={{ width: "22px", height: "22px" }} />
                    : <MessageCircle style={{ width: "22px", height: "22px" }} />
                }
            </button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: "fixed", bottom: "92px", right: "24px", zIndex: 50,
                            width: "380px", maxHeight: "520px", borderRadius: "16px",
                            backgroundColor: "white", border: "1px solid #E2E0DB",
                            boxShadow: "0 8px 40px rgba(0,0,0,0.12)",
                            display: "flex", flexDirection: "column", overflow: "hidden",
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: "16px 18px", backgroundColor: "#1B4332",
                            display: "flex", alignItems: "center", gap: "10px",
                        }}>
                            <div style={{
                                width: "32px", height: "32px", borderRadius: "50%",
                                backgroundColor: "rgba(255,255,255,0.15)", display: "flex",
                                alignItems: "center", justifyContent: "center",
                            }}>
                                <Leaf style={{ width: "16px", height: "16px", color: "#D4A843" }} />
                            </div>
                            <div>
                                <div style={{ fontSize: "14px", fontWeight: 600, color: "white" }}>ESG Help Assistant</div>
                                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>Ask anything about ESG compliance</div>
                            </div>
                        </div>

                        {/* Messages */}
                        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", maxHeight: "320px" }}>
                            {messages.map(function (msg, i) {
                                var isUser = msg.role === "user";
                                return (
                                    <div key={i} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                                        <div style={{
                                            maxWidth: "85%", padding: "10px 14px", borderRadius: "12px",
                                            backgroundColor: isUser ? "#1B4332" : "#F5F1EB",
                                            color: isUser ? "white" : "#1A1A1A",
                                            fontSize: "13px", lineHeight: 1.6,
                                        }}>
                                            {msg.content}
                                        </div>
                                    </div>
                                );
                            })}
                            {loading && (
                                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                                    <div style={{ padding: "10px 14px", borderRadius: "12px", backgroundColor: "#F5F1EB" }}>
                                        <Loader2 style={{ width: "16px", height: "16px", color: "#6B7280", animation: "spin 1s linear infinite" }} />
                                    </div>
                                </div>
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Quick Questions */}
                        {messages.length <= 2 && (
                            <div style={{ padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: "6px" }}>
                                {defaultQuestions.map(function (q, i) {
                                    return (
                                        <button
                                            key={i}
                                            onClick={function () { handleSend(q); }}
                                            style={{
                                                padding: "6px 12px", borderRadius: "8px",
                                                backgroundColor: "#F5F1EB", color: "#1B4332",
                                                fontSize: "11px", fontWeight: 500, border: "1px solid #E2E0DB",
                                                cursor: "pointer", whiteSpace: "nowrap",
                                            }}
                                        >
                                            {q}
                                        </button>
                                    );
                                })}
                            </div>
                        )}

                        {/* Input */}
                        <div style={{ padding: "12px 16px", borderTop: "1px solid #E2E0DB", display: "flex", gap: "8px" }}>
                            <input
                                type="text"
                                value={input}
                                onChange={function (e) { setInput(e.target.value); }}
                                onKeyDown={function (e) { if (e.key === "Enter") handleSend(); }}
                                placeholder="Ask about ESG, BRSR, KPIs..."
                                style={{
                                    flex: 1, padding: "10px 14px", borderRadius: "10px",
                                    border: "1px solid #E2E0DB", fontSize: "13px",
                                    outline: "none", backgroundColor: "#FAFAF7",
                                }}
                            />
                            <button
                                onClick={function () { handleSend(); }}
                                disabled={!input.trim() || loading}
                                style={{
                                    width: "40px", height: "40px", borderRadius: "10px",
                                    backgroundColor: input.trim() && !loading ? "#1B4332" : "#E2E0DB",
                                    color: "white", border: "none", cursor: input.trim() && !loading ? "pointer" : "not-allowed",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                <Send style={{ width: "16px", height: "16px" }} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{"@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }"}</style>
        </>
    );
}