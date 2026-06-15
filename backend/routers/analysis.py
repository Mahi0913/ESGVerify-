"""
Analysis Router — buyer search, gap analysis, suggestions, help bot.
Handles AI-powered analysis features.
Endpoints: POST /search-buyer, /summarize-buyer, /search-schemes,
           /analyze-gaps, /buyer-expansion, /generate-suggestions, /help-bot
"""

from fastapi import APIRouter

from utils.web_search import (search_buyer_requirements,
                               search_government_schemes,
                               summarize_buyer_requirements)
from components.gap_analyzer import analyze_gaps, analyze_buyer_expansion
from components.suggestion_engine import generate_suggestions
from routers.deps import (BuyerSearchRequest, GapRequest, SuggestionRequest,
                          ExpansionRequest, HelpBotRequest)

router = APIRouter(prefix="/api", tags=["Analysis"])


# ─── BUYER SEARCH ───

@router.post("/search-buyer")
async def api_search_buyer(req: BuyerSearchRequest):
    """Search the web for buyer's ESG/sustainability requirements."""
    results = search_buyer_requirements(req.buyer_name, req.industry)
    return {"results": results}


@router.post("/summarize-buyer")
async def api_summarize_buyer(req: BuyerSearchRequest):
    """Search + AI summarization of buyer requirements.
    Checks industry relevance and provides actionable compliance brief.
    """
    search_results = search_buyer_requirements(req.buyer_name, req.industry)
    summary = summarize_buyer_requirements(
        req.buyer_name, search_results, req.industry or "Manufacturing")
    return {"search_results": search_results, "summary": summary}


@router.post("/search-schemes")
async def api_search_schemes(req: BuyerSearchRequest):
    """Search for government schemes/subsidies applicable to this MSME."""
    results = search_government_schemes(
        req.industry or "Manufacturing", req.buyer_name)
    return {"results": results}


# ─── GAP ANALYSIS ───

@router.post("/analyze-gaps")
async def api_analyze_gaps(req: GapRequest):
    """Compare MSME KPIs against buyer-specific requirements.
    Returns buyer readiness score + per-KPI gap status.
    """
    return analyze_gaps(
        req.kpis, req.buyer_name, req.buyer_search_results, req.company_data)


@router.post("/buyer-expansion")
async def api_buyer_expansion(req: ExpansionRequest):
    """Analyze what additional improvements are needed for a new buyer."""
    search_results = search_buyer_requirements(req.new_buyer, req.industry)
    return analyze_buyer_expansion(
        req.current_gaps, req.new_buyer, search_results, req.kpis, req.company_data)


# ─── SUGGESTIONS ───

@router.post("/generate-suggestions")
async def api_generate_suggestions(req: SuggestionRequest):
    """Generate prioritized improvement suggestions using AI.
    Uses 3-factor model: buyer weight (50%) + gap severity (30%) + ease (20%).
    """
    return generate_suggestions(
        req.kpis, req.gap_analysis, req.company_data,
        req.buyer_name, req.govt_schemes_results)


# ─── HELP BOT ───

@router.post("/help-bot")
async def help_bot(req: HelpBotRequest):
    """AI-powered ESG help assistant for MSMEs.
    Answers in simple language with Indian regulatory context.
    """
    from utils.ai_client import ai_generate

    system_msg = """You are an ESG help assistant for Indian MSMEs. 
    Answer in simple, clear language. No jargon. 
    Keep answers under 100 words.
    If asked about calculations, give the formula with an example.
    If asked about terms, explain like you are talking to a factory owner who has never heard of ESG.
    Always relate answers to Indian context (SEBI BRSR, Indian Factories Act, state minimum wages, CEA factors).
    If you don't know, say so honestly."""

    answer = ai_generate(req.question, system_msg, max_tokens=300)
    if not answer:
        answer = "I'm sorry, I couldn't process your question right now. Please try again or rephrase your question."

    return {"answer": answer}
