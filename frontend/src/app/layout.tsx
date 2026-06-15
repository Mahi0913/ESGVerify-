import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import HelpBot from "@/components/HelpBot";

const inter = Inter({
    subsets: ["latin"],
    variable: "--font-inter",
});

const spaceGrotesk = Space_Grotesk({
    subsets: ["latin"],
    variable: "--font-heading",
});

export const metadata: Metadata = {
    title: "ESGVerify — BRSR Compliance for Indian MSMEs",
    description: "AI-powered ESG compliance platform with fuzzy logic greenwash detection",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={`${inter.variable} ${spaceGrotesk.variable} font-[family-name:var(--font-inter)] antialiased`}>
                {children}
                <HelpBot />
            </body>
        </html>
    );
}