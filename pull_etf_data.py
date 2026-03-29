"""
ETF Data Pull Script
====================
Uses yfinance to pull publicly available ETF data and compute
derived performance metrics for the ETF Finder app.

Usage:
  pip install yfinance
  python pull_etf_data.py

Output:
  etf_data.json — paste the contents into App.jsx to replace ETF_DATA

Notes:
  - This script is for personal/educational use only
  - Data is pulled from Yahoo Finance's public pages via yfinance
  - yfinance is not affiliated with Yahoo and is intended for personal use
  - The output is derived analysis (percentage returns, categories) 
    not raw price data
  - Run locally, do not call from a live website
"""

import json
import yfinance as yf
from datetime import datetime, timedelta
import sys

# ─── ETF Universe ───
# Add or remove tickers as needed. These are popular US-listed ETFs
# across multiple sectors, asset classes, and strategies.
TICKERS = [
    # Broad Market / Index
    "SPY", "VOO", "VTI", "QQQ", "IWM", "IWF", "IWD", "VTV", "VUG", "VO",
    "VB", "MDY", "IJR", "RSP", "SPLG", "SCHX", "SCHA", "SCHB",
    # Sector - Technology
    "XLK", "VGT", "SOXX", "SMH", "ARKK", "HACK", "BOTZ", "IGV", "SKYY", "WCLD",
    # Sector - Healthcare
    "XLV", "VHT", "IBB", "XBI", "ARKG",
    # Sector - Financials
    "XLF", "VFH", "KBE", "KRE",
    # Sector - Energy
    "XLE", "VDE", "XOP", "OIH", "ICLN", "TAN", "QCLN",
    # Sector - Consumer
    "XLY", "XLP", "VCR", "VDC",
    # Sector - Industrials
    "XLI", "VIS",
    # Sector - Materials
    "XLB", "VAW",
    # Sector - Utilities
    "XLU", "VPU",
    # Sector - Real Estate
    "XLRE", "VNQ", "VNQI",
    # Sector - Communication
    "XLC", "VOX",
    # Fixed Income
    "BND", "AGG", "TLT", "IEF", "SHY", "TIP", "LQD", "HYG", "JNK",
    "VCSH", "VCIT", "VCLT", "BIV", "BSV", "MUB", "EMB", "BNDX",
    # International
    "VEA", "VWO", "EFA", "EEM", "VXUS", "IXUS", "IEFA", "IEMG",
    "VGK", "EWJ", "EWZ", "FXI", "KWEB", "INDA",
    # Commodities
    "GLD", "SLV", "IAU", "GDX", "DBA", "USO", "DBC",
    # Dividend / Income
    "SCHD", "VIG", "VYM", "DVY", "HDV", "DGRO", "JEPI", "JEPQ",
    # Crypto
    "IBIT", "ETHE",
    # ESG
    "ESGU", "ESGV", "SUSA",
    # Thematic
    "ARKW", "ARKG", "LIT", "REMX", "HERO", "BETZ",
]

# Remove duplicates while preserving order
TICKERS = list(dict.fromkeys(TICKERS))

# ─── Style/Cap Classification ───
# Maps ETF characteristics to Morningstar-style categories
# You can extend this mapping as needed
STYLE_MAP = {
    # Large Cap Blend
    "SPY": ("Large", "Blend"), "VOO": ("Large", "Blend"), "VTI": ("Large", "Blend"),
    "SPLG": ("Large", "Blend"), "SCHX": ("Large", "Blend"), "SCHB": ("Large", "Blend"),
    "RSP": ("Large", "Blend"), "ESGU": ("Large", "Blend"), "ESGV": ("Large", "Blend"),
    "SUSA": ("Large", "Blend"),
    # Large Cap Growth
    "QQQ": ("Large", "Growth"), "VUG": ("Large", "Growth"), "IWF": ("Large", "Growth"),
    "XLK": ("Large", "Growth"), "VGT": ("Large", "Growth"), "XLY": ("Large", "Growth"),
    "XLC": ("Large", "Growth"), "IGV": ("Large", "Growth"),
    # Large Cap Value
    "VTV": ("Large", "Value"), "IWD": ("Large", "Value"), "XLF": ("Large", "Value"),
    "XLE": ("Large", "Value"), "XLV": ("Large", "Blend"), "XLU": ("Large", "Value"),
    "XLP": ("Large", "Value"), "XLI": ("Large", "Blend"), "SCHD": ("Large", "Value"),
    "VYM": ("Large", "Value"), "DVY": ("Large", "Value"), "HDV": ("Large", "Value"),
    "DGRO": ("Large", "Blend"), "VIG": ("Large", "Blend"), "JEPI": ("Large", "Value"),
    "JEPQ": ("Large", "Growth"),
    # Mid Cap
    "VO": ("Mid", "Blend"), "MDY": ("Mid", "Blend"), "ARKK": ("Mid", "Growth"),
    "XLB": ("Mid", "Blend"), "XLRE": ("Mid", "Value"), "VNQ": ("Mid", "Value"),
    "IBB": ("Mid", "Growth"), "XBI": ("Mid", "Growth"), "HACK": ("Mid", "Growth"),
    "BOTZ": ("Mid", "Growth"), "ICLN": ("Mid", "Growth"), "TAN": ("Mid", "Growth"),
    "ARKG": ("Mid", "Growth"), "ARKW": ("Mid", "Growth"), "LIT": ("Mid", "Growth"),
    "HERO": ("Mid", "Growth"), "BETZ": ("Mid", "Growth"),
    # Small Cap
    "IWM": ("Small", "Blend"), "VB": ("Small", "Blend"), "IJR": ("Small", "Blend"),
    "SCHA": ("Small", "Blend"),
}

# ─── Sector/Industry Classification ───
SECTOR_MAP = {
    "SPY": ("Broad Market", "Large Cap Blend"), "VOO": ("Broad Market", "Large Cap Blend"),
    "VTI": ("Broad Market", "Total Market"), "QQQ": ("Technology", "Large Cap Growth"),
    "IWM": ("Broad Market", "Small Cap Blend"), "IWF": ("Broad Market", "Large Cap Growth"),
    "IWD": ("Broad Market", "Large Cap Value"), "VTV": ("Broad Market", "Large Cap Value"),
    "VUG": ("Broad Market", "Large Cap Growth"), "VO": ("Broad Market", "Mid Cap Blend"),
    "VB": ("Broad Market", "Small Cap Blend"), "MDY": ("Broad Market", "Mid Cap Blend"),
    "IJR": ("Broad Market", "Small Cap Blend"), "RSP": ("Broad Market", "Equal Weight"),
    "SPLG": ("Broad Market", "Large Cap Blend"), "SCHX": ("Broad Market", "Large Cap Blend"),
    "SCHA": ("Broad Market", "Small Cap Blend"), "SCHB": ("Broad Market", "Total Market"),
    "XLK": ("Technology", "Information Technology"), "VGT": ("Technology", "Information Technology"),
    "SOXX": ("Technology", "Semiconductors"), "SMH": ("Technology", "Semiconductors"),
    "ARKK": ("Technology", "Disruptive Innovation"), "HACK": ("Technology", "Cybersecurity"),
    "BOTZ": ("Technology", "Robotics & AI"), "IGV": ("Technology", "Software"),
    "SKYY": ("Technology", "Cloud Computing"), "WCLD": ("Technology", "Cloud Computing"),
    "XLV": ("Healthcare", "Diversified Healthcare"), "VHT": ("Healthcare", "Diversified Healthcare"),
    "IBB": ("Healthcare", "Biotechnology"), "XBI": ("Healthcare", "Biotechnology"),
    "ARKG": ("Healthcare", "Genomics"), "XLF": ("Financials", "Diversified Financials"),
    "VFH": ("Financials", "Diversified Financials"), "KBE": ("Financials", "Banking"),
    "KRE": ("Financials", "Regional Banking"),
    "XLE": ("Energy", "Oil & Gas"), "VDE": ("Energy", "Diversified Energy"),
    "XOP": ("Energy", "Oil & Gas Exploration"), "OIH": ("Energy", "Oil Services"),
    "ICLN": ("Energy", "Clean Energy"), "TAN": ("Energy", "Solar"),
    "QCLN": ("Energy", "Clean Energy"), "XLY": ("Consumer Discretionary", "Retail & Consumer"),
    "XLP": ("Consumer Staples", "Consumer Products"), "VCR": ("Consumer Discretionary", "Diversified Consumer"),
    "VDC": ("Consumer Staples", "Diversified Staples"),
    "XLI": ("Industrials", "Diversified Industrials"), "VIS": ("Industrials", "Diversified Industrials"),
    "XLB": ("Materials", "Chemicals & Mining"), "VAW": ("Materials", "Diversified Materials"),
    "XLU": ("Utilities", "Electric Utilities"), "VPU": ("Utilities", "Diversified Utilities"),
    "XLRE": ("Real Estate", "REITs"), "VNQ": ("Real Estate", "REITs"),
    "VNQI": ("Real Estate", "International REITs"),
    "XLC": ("Communication Services", "Media & Telecom"), "VOX": ("Communication Services", "Diversified Telecom"),
    "BND": ("Fixed Income", "Investment Grade Bonds"), "AGG": ("Fixed Income", "Investment Grade Bonds"),
    "TLT": ("Fixed Income", "Long-Term Treasury"), "IEF": ("Fixed Income", "Intermediate Treasury"),
    "SHY": ("Fixed Income", "Short-Term Treasury"), "TIP": ("Fixed Income", "Inflation Protected"),
    "LQD": ("Fixed Income", "Corporate Bonds"), "HYG": ("Fixed Income", "High Yield Bonds"),
    "JNK": ("Fixed Income", "High Yield Bonds"), "VCSH": ("Fixed Income", "Short-Term Corporate"),
    "VCIT": ("Fixed Income", "Intermediate Corporate"), "VCLT": ("Fixed Income", "Long-Term Corporate"),
    "BIV": ("Fixed Income", "Intermediate Bonds"), "BSV": ("Fixed Income", "Short-Term Bonds"),
    "MUB": ("Fixed Income", "Municipal Bonds"), "EMB": ("Fixed Income", "Emerging Market Bonds"),
    "BNDX": ("Fixed Income", "International Bonds"),
    "VEA": ("Broad Market", "International Developed"), "VWO": ("Broad Market", "Emerging Markets"),
    "EFA": ("Broad Market", "International Developed"), "EEM": ("Broad Market", "Emerging Markets"),
    "VXUS": ("Broad Market", "Total International"), "IXUS": ("Broad Market", "Total International"),
    "IEFA": ("Broad Market", "International Developed"), "IEMG": ("Broad Market", "Emerging Markets"),
    "VGK": ("Broad Market", "Europe"), "EWJ": ("Broad Market", "Japan"),
    "EWZ": ("Broad Market", "Brazil"), "FXI": ("Broad Market", "China Large Cap"),
    "KWEB": ("Technology", "China Internet"), "INDA": ("Broad Market", "India"),
    "GLD": ("Commodities", "Precious Metals"), "SLV": ("Commodities", "Precious Metals"),
    "IAU": ("Commodities", "Precious Metals"), "GDX": ("Commodities", "Gold Miners"),
    "DBA": ("Commodities", "Agriculture"), "USO": ("Commodities", "Oil"),
    "DBC": ("Commodities", "Diversified Commodities"),
    "SCHD": ("Broad Market", "Dividend Focus"), "VIG": ("Broad Market", "Dividend Growth"),
    "VYM": ("Broad Market", "High Dividend"), "DVY": ("Broad Market", "Dividend Select"),
    "HDV": ("Broad Market", "High Dividend"), "DGRO": ("Broad Market", "Dividend Growth"),
    "JEPI": ("Broad Market", "Covered Call Strategy"), "JEPQ": ("Technology", "Covered Call Strategy"),
    "IBIT": ("Digital Assets", "Cryptocurrency"), "ETHE": ("Digital Assets", "Cryptocurrency"),
    "ESGU": ("Broad Market", "ESG Large Cap"), "ESGV": ("Broad Market", "ESG Total Market"),
    "SUSA": ("Broad Market", "ESG Select"),
    "ARKW": ("Technology", "Next Gen Internet"), "LIT": ("Materials", "Lithium & Battery"),
    "REMX": ("Materials", "Rare Earth Metals"), "HERO": ("Technology", "Video Games & Esports"),
    "BETZ": ("Technology", "Sports Betting & iGaming"),
}

# ─── Risk Classification ───
RISK_MAP = {
    "Conservative": ["BND", "AGG", "SHY", "BSV", "VCSH", "MUB", "XLU", "XLP", "VPU", "VDC", "TIP", "BNDX"],
    "Moderately Conservative": ["TLT", "IEF", "LQD", "BIV", "VCIT", "VCLT", "XLRE", "VNQ", "VNQI",
                                 "SCHD", "VIG", "VYM", "DVY", "HDV", "DGRO", "JEPI", "EMB"],
    "Moderate": ["SPY", "VOO", "VTI", "XLV", "VHT", "XLF", "VFH", "XLI", "VIS", "XLC", "VOX",
                 "VEA", "EFA", "VXUS", "IXUS", "IEFA", "VGK", "GLD", "IAU", "HYG", "JNK",
                 "RSP", "SPLG", "SCHX", "SCHB", "ESGU", "ESGV", "SUSA", "IWD", "VTV", "EWJ",
                 "DBC"],
    "Moderately Aggressive": ["QQQ", "XLK", "VGT", "XLE", "VDE", "XLY", "VCR", "XLB", "VAW",
                               "VUG", "IWF", "JEPQ", "IGV", "HACK", "DBA", "OIH", "XOP",
                               "KBE", "KRE", "VO", "MDY", "EWZ", "INDA"],
    "Aggressive": ["IWM", "VB", "IJR", "SCHA", "ARKK", "SOXX", "SMH", "IBB", "XBI", "BOTZ",
                   "ICLN", "TAN", "QCLN", "VWO", "EEM", "IEMG", "FXI", "KWEB", "SLV", "GDX",
                   "USO", "IBIT", "ETHE", "ARKG", "ARKW", "LIT", "REMX", "HERO", "BETZ",
                   "SKYY", "WCLD"],
}

# Invert risk map for lookup
RISK_LOOKUP = {}
for risk, tickers in RISK_MAP.items():
    for t in tickers:
        RISK_LOOKUP[t] = risk

# ─── Asset Class ───
ASSET_CLASS_MAP = {}
for t in TICKERS:
    sector = SECTOR_MAP.get(t, ("Unknown", "Unknown"))[0]
    if sector == "Fixed Income":
        ASSET_CLASS_MAP[t] = "Fixed Income"
    elif sector == "Commodities":
        ASSET_CLASS_MAP[t] = "Commodity"
    elif sector == "Digital Assets":
        ASSET_CLASS_MAP[t] = "Crypto"
    else:
        ASSET_CLASS_MAP[t] = "Equity"

# ─── Geography ───
GEO_MAP = {
    "VEA": "International Developed", "EFA": "International Developed", "IEFA": "International Developed",
    "VGK": "International Developed", "EWJ": "International Developed",
    "VWO": "Emerging Markets", "EEM": "Emerging Markets", "IEMG": "Emerging Markets",
    "FXI": "Emerging Markets", "KWEB": "Emerging Markets", "EWZ": "Emerging Markets",
    "INDA": "Emerging Markets", "EMB": "Emerging Markets",
    "VXUS": "Global", "IXUS": "Global", "BNDX": "Global", "VNQI": "Global",
    "ICLN": "Global", "BOTZ": "Global", "GLD": "Global", "SLV": "Global",
    "IAU": "Global", "GDX": "Global", "DBA": "Global", "USO": "Global",
    "DBC": "Global", "IBIT": "Global", "ETHE": "Global",
}

# ESG funds
ESG_TICKERS = {"ESGU", "ESGV", "SUSA", "ICLN", "TAN", "QCLN"}


def compute_performance(hist, days_back, label):
    """Compute percentage return over a number of trading days."""
    if hist is None or len(hist) < 2:
        return 0.0
    try:
        end_price = hist["Close"].iloc[-1]
        if days_back >= len(hist):
            start_price = hist["Close"].iloc[0]
        else:
            start_price = hist["Close"].iloc[-days_back]
        if start_price == 0:
            return 0.0
        return round(((end_price - start_price) / start_price) * 100, 1)
    except Exception:
        return 0.0


def get_ytd_return(hist):
    """Compute year-to-date return."""
    if hist is None or len(hist) < 2:
        return 0.0
    try:
        current_year = datetime.now().year
        year_start = hist.loc[hist.index >= f"{current_year}-01-01"]
        if len(year_start) < 1:
            return 0.0
        start_price = year_start["Close"].iloc[0]
        end_price = hist["Close"].iloc[-1]
        if start_price == 0:
            return 0.0
        return round(((end_price - start_price) / start_price) * 100, 1)
    except Exception:
        return 0.0


def pull_etf_data():
    """Pull data for all tickers and output JSON."""
    print(f"Pulling data for {len(TICKERS)} ETFs...")
    print("This may take a few minutes depending on your connection.\n")

    results = []
    failed = []

    for i, ticker in enumerate(TICKERS):
        try:
            print(f"  [{i+1}/{len(TICKERS)}] {ticker}...", end=" ", flush=True)
            etf = yf.Ticker(ticker)
            info = etf.info or {}

            # Pull 3 years of history for performance calcs
            hist = etf.history(period="3y")

            if hist is None or len(hist) < 10:
                print("SKIP (no data)")
                failed.append(ticker)
                continue

            # Basic info
            name = info.get("longName") or info.get("shortName") or ticker
            expense = info.get("annualReportExpenseRatio") or info.get("totalExpenseRatio") or 0
            if expense and expense > 1:  # Some report as percentage, some as decimal
                expense = expense / 100
            expense = round(expense * 100, 2) if expense else 0.0  # Store as percentage

            aum = info.get("totalAssets") or 0
            aum_millions = round(aum / 1_000_000) if aum else 0

            div_yield = info.get("yield") or info.get("dividendYield") or 0
            div_yield = round(div_yield * 100, 1) if div_yield else 0.0

            provider = info.get("fundFamily") or "Unknown"
            # Clean up provider names
            provider_clean = provider.split(",")[0].strip()
            for prefix in ["The ", "the "]:
                if provider_clean.startswith(prefix):
                    provider_clean = provider_clean[len(prefix):]

            # Performance (approximate trading days)
            perf = {
                "1D": compute_performance(hist, 1, "1D"),
                "1W": compute_performance(hist, 5, "1W"),
                "1M": compute_performance(hist, 21, "1M"),
                "3M": compute_performance(hist, 63, "3M"),
                "6M": compute_performance(hist, 126, "6M"),
                "YTD": get_ytd_return(hist),
                "1Y": compute_performance(hist, 252, "1Y"),
                "2Y": compute_performance(hist, 504, "2Y"),
                "3Y": compute_performance(hist, 756, "3Y"),
            }

            # Classifications
            sector, industry = SECTOR_MAP.get(ticker, ("Other", "Other"))
            risk = RISK_LOOKUP.get(ticker, "Moderate")
            asset_class = ASSET_CLASS_MAP.get(ticker, "Equity")
            geo = GEO_MAP.get(ticker, "US")
            cap_style = STYLE_MAP.get(ticker, (None, None))
            esg = ticker in ESG_TICKERS

            # Build tags from various attributes
            tags = []
            tags.append(sector.lower())
            tags.append(industry.lower())
            if asset_class != "Equity":
                tags.append(asset_class.lower())
            if geo != "US":
                tags.append(geo.lower())
            if esg:
                tags.extend(["esg", "sustainable"])
            if div_yield >= 3:
                tags.append("dividends")
            if "bond" in industry.lower() or "treasury" in industry.lower():
                tags.extend(["bonds", "fixed income"])
            if "growth" in industry.lower():
                tags.append("growth")
            if "value" in industry.lower() or "dividend" in industry.lower():
                tags.append("value")

            record = {
                "ticker": ticker,
                "name": name,
                "sector": sector,
                "industry": industry,
                "asset_class": asset_class,
                "geo": geo,
                "provider": provider_clean,
                "risk": risk,
                "esg": esg,
                "expense": expense,
                "aum": aum_millions,
                "div_yield": div_yield,
                "cap": cap_style[0],
                "style": cap_style[1],
                "perf": perf,
                "tags": list(set(tags)),  # Dedupe
            }

            results.append(record)
            print(f"OK ({name[:40]})")

        except Exception as e:
            print(f"FAIL ({e})")
            failed.append(ticker)
            continue

    # Output
    print(f"\n{'='*50}")
    print(f"Successfully pulled: {len(results)} ETFs")
    if failed:
        print(f"Failed: {len(failed)} — {', '.join(failed)}")
    print(f"{'='*50}\n")

    # Write JSON
    output_file = "etf_data.json"
    with open(output_file, "w") as f:
        json.dump(results, f, indent=2)

    print(f"Data written to {output_file}")
    print(f"Copy the contents of this file into App.jsx to replace the ETF_DATA array.")
    print(f"\nRemember: This data is for personal/educational use only.")


if __name__ == "__main__":
    pull_etf_data()
