"""
HOW IT WORKS:
    1. ai_generate() — Core function that calls AI providers in order
    2. ai_json() — Calls AI and parses JSON response  
    3. ai_text() — Calls AI and returns plain text

PROVIDER ORDER:
    Groq (free, fast) → Gemini (free tier) → OpenAI (paid backup)
    
    Add your keys to .env:
        GROQ_API_KEY=gsk_xxxxx
        GEMINI_API_KEY=xxxxx  
        OPENAI_API_KEY=sk-xxxxx
"""
import os
import json
import requests
from dotenv import load_dotenv
load_dotenv()

GROQ_KEY = os.getenv("GROQ_API_KEY")
GEMINI_KEY = os.getenv("GEMINI_API_KEY")
OPENAI_KEY = os.getenv("OPENAI_API_KEY")


def ai_generate(prompt, system_msg="You are an ESG expert. Respond ONLY in valid JSON. No markdown. No backticks.", max_tokens=2000, temperature=0.3):
    """Call AI. Tries Groq first (free), then Gemini, then OpenAI."""

    # 1. Try Groq (FREE, fast, generous limits)
    if GROQ_KEY and "paste" not in GROQ_KEY:
        try:
            resp = requests.post("https://api.groq.com/openai/v1/chat/completions",
                                 headers={"Authorization": f"Bearer {GROQ_KEY}",
                                          "Content-Type": "application/json"},
                                 json={"model": "llama-3.3-70b-versatile",
                                       "messages": [{"role": "system", "content": system_msg}, {"role": "user", "content": prompt}],
                                       "temperature": temperature, "max_tokens": max_tokens},
                                 timeout=30)
            if resp.status_code == 200:
                return resp.json()["choices"][0]["message"]["content"].strip()
            else:
                print(f"Groq error {resp.status_code}: {resp.text[:200]}")
        except Exception as e:
            print(f"Groq error: {e}")

    # 2. Try Gemini (free tier)
    if GEMINI_KEY and "paste" not in GEMINI_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_KEY)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=f"{system_msg}\n\n{prompt}",
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini error: {e}")

    # 3. Try OpenAI (paid)
    if OPENAI_KEY and "paste" not in OPENAI_KEY:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_KEY)
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "system", "content": system_msg},
                          {"role": "user", "content": prompt}],
                temperature=temperature, max_tokens=max_tokens)
            return resp.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI error: {e}")

    print("ALL AI PROVIDERS FAILED. Check your API keys in .env file.")
    return None


def ai_json(prompt, system_msg="You are an ESG expert. Respond ONLY in valid JSON. No markdown. No backticks.", max_tokens=2000, temperature=0.3):
    """Call AI and parse JSON response."""
    raw = ai_generate(prompt, system_msg, max_tokens, temperature)
    if not raw:
        return None
    try:
        cleaned = raw.replace("```json", "").replace("```", "").strip()
        return json.loads(cleaned)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        print(f"Raw: {raw[:300]}")
        return None


def ai_text(prompt, system_msg="You are an ESG consultant for Indian MSMEs.", max_tokens=2000, temperature=0.4):
    """Call AI and return plain text."""
    return ai_generate(prompt, system_msg, max_tokens, temperature)
