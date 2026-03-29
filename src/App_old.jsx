import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";

// ─── Sample ETF Dataset ───
const ETF_DATA = [
  { ticker: "SPY", name: "SPDR S&P 500 ETF Trust", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 515000, div_yield: 1.3, perf: { "1D": 0.4, "1W": 1.2, "1M": 3.1, "3M": 5.8, "6M": 9.2, "YTD": 12.1, "1Y": 22.4, "2Y": 38.1, "3Y": 42.5 }, tags: ["index","s&p 500","large cap","passive","broad market","core holding","retirement"] },
  { ticker: "QQQ", name: "Invesco QQQ Trust", sector: "Technology", industry: "Large Cap Growth", asset_class: "Equity", geo: "US", provider: "Invesco", risk: "Moderately Aggressive", esg: false, expense: 0.20, aum: 250000, div_yield: 0.5, perf: { "1D": 0.6, "1W": 1.8, "1M": 4.2, "3M": 8.5, "6M": 14.1, "YTD": 18.3, "1Y": 30.2, "2Y": 55.0, "3Y": 48.2 }, tags: ["nasdaq","tech","growth","innovation","mega cap","ai","software"] },
  { ticker: "VTI", name: "Vanguard Total Stock Market ETF", sector: "Broad Market", industry: "Total Market", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.03, aum: 380000, div_yield: 1.4, perf: { "1D": 0.3, "1W": 1.1, "1M": 2.9, "3M": 5.5, "6M": 8.8, "YTD": 11.5, "1Y": 21.0, "2Y": 35.8, "3Y": 40.1 }, tags: ["total market","index","diversified","core","passive","all cap","broad market"] },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.03, aum: 420000, div_yield: 1.3, perf: { "1D": 0.4, "1W": 1.2, "1M": 3.1, "3M": 5.9, "6M": 9.3, "YTD": 12.2, "1Y": 22.5, "2Y": 38.3, "3Y": 42.8 }, tags: ["s&p 500","index","passive","core holding","large cap","retirement","low cost"] },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", sector: "Broad Market", industry: "Small Cap Blend", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.19, aum: 62000, div_yield: 1.1, perf: { "1D": -0.2, "1W": 0.5, "1M": 1.8, "3M": 2.1, "6M": 3.5, "YTD": 5.2, "1Y": 12.8, "2Y": 20.3, "3Y": 15.6 }, tags: ["small cap","russell 2000","growth potential","volatile","domestic","value hunting"] },
  { ticker: "ARKK", name: "ARK Innovation ETF", sector: "Technology", industry: "Disruptive Innovation", asset_class: "Equity", geo: "US", provider: "ARK Invest", risk: "Aggressive", esg: false, expense: 0.75, aum: 6800, div_yield: 0.0, perf: { "1D": 1.2, "1W": 3.5, "1M": 8.1, "3M": 12.4, "6M": -5.2, "YTD": 15.8, "1Y": -8.5, "2Y": -22.1, "3Y": -45.2 }, tags: ["innovation","disruptive","genomics","ai","fintech","autonomous","high risk","cathie wood"] },
  { ticker: "VGT", name: "Vanguard Information Technology ETF", sector: "Technology", industry: "Information Technology", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.10, aum: 72000, div_yield: 0.6, perf: { "1D": 0.5, "1W": 1.6, "1M": 3.8, "3M": 7.8, "6M": 13.2, "YTD": 17.1, "1Y": 28.9, "2Y": 50.2, "3Y": 45.8 }, tags: ["tech","software","semiconductors","cloud","information technology","growth"] },
  { ticker: "XLK", name: "Technology Select Sector SPDR", sector: "Technology", industry: "Information Technology", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 55000, div_yield: 0.7, perf: { "1D": 0.5, "1W": 1.5, "1M": 3.6, "3M": 7.5, "6M": 12.8, "YTD": 16.5, "1Y": 27.8, "2Y": 48.5, "3Y": 44.1 }, tags: ["tech","sector","spdr","information technology","large cap tech"] },
  { ticker: "XLF", name: "Financial Select Sector SPDR", sector: "Financials", industry: "Diversified Financials", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 38000, div_yield: 1.5, perf: { "1D": 0.2, "1W": 0.8, "1M": 2.5, "3M": 4.8, "6M": 8.1, "YTD": 10.8, "1Y": 18.5, "2Y": 28.2, "3Y": 25.8 }, tags: ["financials","banks","insurance","sector","banking","interest rates"] },
  { ticker: "XLE", name: "Energy Select Sector SPDR", sector: "Energy", industry: "Oil & Gas", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 35000, div_yield: 3.5, perf: { "1D": -0.8, "1W": -1.2, "1M": -3.5, "3M": -5.2, "6M": 2.1, "YTD": -8.5, "1Y": 5.2, "2Y": 18.5, "3Y": 85.2 }, tags: ["energy","oil","gas","commodities","dividends","cyclical"] },
  { ticker: "XLV", name: "Health Care Select Sector SPDR", sector: "Healthcare", industry: "Diversified Healthcare", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 36000, div_yield: 1.4, perf: { "1D": 0.1, "1W": 0.6, "1M": 1.8, "3M": 3.2, "6M": 5.8, "YTD": 7.2, "1Y": 12.1, "2Y": 18.5, "3Y": 22.1 }, tags: ["healthcare","pharma","biotech","medical","defensive","stable"] },
  { ticker: "XLU", name: "Utilities Select Sector SPDR", sector: "Utilities", industry: "Electric Utilities", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Conservative", esg: false, expense: 0.09, aum: 14000, div_yield: 3.1, perf: { "1D": 0.1, "1W": 0.3, "1M": 1.2, "3M": 2.8, "6M": 5.5, "YTD": 8.2, "1Y": 15.2, "2Y": 12.8, "3Y": 18.5 }, tags: ["utilities","dividends","defensive","income","stable","conservative","low volatility"] },
  { ticker: "XLP", name: "Consumer Staples Select Sector SPDR", sector: "Consumer Staples", industry: "Consumer Products", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Conservative", esg: false, expense: 0.09, aum: 16000, div_yield: 2.6, perf: { "1D": 0.0, "1W": 0.2, "1M": 0.8, "3M": 2.1, "6M": 4.2, "YTD": 5.8, "1Y": 8.5, "2Y": 10.2, "3Y": 15.8 }, tags: ["consumer staples","defensive","dividends","food","household","stable","recession proof"] },
  { ticker: "XLY", name: "Consumer Discretionary Select Sector SPDR", sector: "Consumer Discretionary", industry: "Retail & Consumer", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 18000, div_yield: 0.8, perf: { "1D": 0.3, "1W": 1.0, "1M": 2.8, "3M": 5.2, "6M": 8.5, "YTD": 11.2, "1Y": 20.1, "2Y": 32.5, "3Y": 28.8 }, tags: ["consumer discretionary","retail","amazon","tesla","spending","cyclical"] },
  { ticker: "XLRE", name: "Real Estate Select Sector SPDR", sector: "Real Estate", industry: "REITs", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Conservative", esg: false, expense: 0.09, aum: 6200, div_yield: 3.4, perf: { "1D": 0.1, "1W": 0.4, "1M": 1.5, "3M": 3.1, "6M": 5.2, "YTD": 6.8, "1Y": 10.5, "2Y": 8.2, "3Y": 12.1 }, tags: ["real estate","reits","income","dividends","property","interest rate sensitive"] },
  { ticker: "XLC", name: "Communication Services Select Sector SPDR", sector: "Communication Services", industry: "Media & Telecom", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 18500, div_yield: 0.7, perf: { "1D": 0.4, "1W": 1.3, "1M": 3.2, "3M": 6.8, "6M": 11.5, "YTD": 14.8, "1Y": 25.2, "2Y": 42.1, "3Y": 18.5 }, tags: ["communication","media","social media","telecom","meta","google","streaming"] },
  { ticker: "XLI", name: "Industrial Select Sector SPDR", sector: "Industrials", industry: "Diversified Industrials", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 17500, div_yield: 1.3, perf: { "1D": 0.2, "1W": 0.7, "1M": 2.1, "3M": 4.5, "6M": 7.8, "YTD": 10.2, "1Y": 17.8, "2Y": 28.5, "3Y": 32.1 }, tags: ["industrials","manufacturing","infrastructure","defense","aerospace","transportation"] },
  { ticker: "XLB", name: "Materials Select Sector SPDR", sector: "Materials", industry: "Chemicals & Mining", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 5800, div_yield: 1.8, perf: { "1D": -0.1, "1W": 0.3, "1M": 1.5, "3M": 2.8, "6M": 4.5, "YTD": 5.2, "1Y": 8.8, "2Y": 12.5, "3Y": 22.8 }, tags: ["materials","mining","chemicals","commodities","gold","copper","cyclical"] },
  { ticker: "BND", name: "Vanguard Total Bond Market ETF", sector: "Fixed Income", industry: "Investment Grade Bonds", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.03, aum: 105000, div_yield: 3.4, perf: { "1D": 0.0, "1W": 0.1, "1M": 0.5, "3M": 1.2, "6M": 2.1, "YTD": 2.8, "1Y": 4.5, "2Y": 2.8, "3Y": -5.2 }, tags: ["bonds","fixed income","conservative","income","safe","treasury","core bond","retirement"] },
  { ticker: "AGG", name: "iShares Core US Aggregate Bond ETF", sector: "Fixed Income", industry: "Investment Grade Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.03, aum: 98000, div_yield: 3.3, perf: { "1D": 0.0, "1W": 0.1, "1M": 0.4, "3M": 1.1, "6M": 2.0, "YTD": 2.7, "1Y": 4.3, "2Y": 2.5, "3Y": -5.5 }, tags: ["bonds","aggregate","fixed income","conservative","income","core bond"] },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", sector: "Fixed Income", industry: "Long-Term Treasury", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.15, aum: 42000, div_yield: 3.8, perf: { "1D": 0.1, "1W": 0.3, "1M": 1.2, "3M": 2.5, "6M": -1.8, "YTD": 3.2, "1Y": 1.5, "2Y": -8.2, "3Y": -28.5 }, tags: ["treasury","long term bonds","interest rate","fixed income","government bonds","duration"] },
  { ticker: "LQD", name: "iShares iBoxx $ Investment Grade Corp Bond ETF", sector: "Fixed Income", industry: "Corporate Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.14, aum: 35000, div_yield: 4.2, perf: { "1D": 0.0, "1W": 0.2, "1M": 0.8, "3M": 1.8, "6M": 3.2, "YTD": 3.8, "1Y": 6.2, "2Y": 5.5, "3Y": -4.8 }, tags: ["corporate bonds","investment grade","income","fixed income","credit"] },
  { ticker: "HYG", name: "iShares iBoxx $ High Yield Corp Bond ETF", sector: "Fixed Income", industry: "High Yield Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderate", esg: false, expense: 0.49, aum: 15000, div_yield: 5.8, perf: { "1D": 0.1, "1W": 0.3, "1M": 0.9, "3M": 2.2, "6M": 3.8, "YTD": 4.5, "1Y": 8.2, "2Y": 10.5, "3Y": 2.8 }, tags: ["high yield","junk bonds","income","corporate bonds","credit risk","higher income"] },
  { ticker: "VEA", name: "Vanguard FTSE Developed Markets ETF", sector: "Broad Market", industry: "International Developed", asset_class: "Equity", geo: "International Developed", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.05, aum: 115000, div_yield: 3.1, perf: { "1D": 0.2, "1W": 0.8, "1M": 2.5, "3M": 4.2, "6M": 6.8, "YTD": 8.5, "1Y": 12.8, "2Y": 18.2, "3Y": 15.5 }, tags: ["international","developed markets","europe","japan","diversification","global"] },
  { ticker: "VWO", name: "Vanguard FTSE Emerging Markets ETF", sector: "Broad Market", industry: "Emerging Markets", asset_class: "Equity", geo: "Emerging Markets", provider: "Vanguard", risk: "Aggressive", esg: false, expense: 0.08, aum: 78000, div_yield: 3.2, perf: { "1D": 0.3, "1W": 0.5, "1M": 1.8, "3M": 3.5, "6M": 5.2, "YTD": 6.8, "1Y": 10.2, "2Y": 8.5, "3Y": -2.8 }, tags: ["emerging markets","china","india","brazil","developing","international","frontier"] },
  { ticker: "EFA", name: "iShares MSCI EAFE ETF", sector: "Broad Market", industry: "International Developed", asset_class: "Equity", geo: "International Developed", provider: "iShares", risk: "Moderate", esg: false, expense: 0.32, aum: 52000, div_yield: 3.0, perf: { "1D": 0.2, "1W": 0.7, "1M": 2.3, "3M": 4.0, "6M": 6.5, "YTD": 8.2, "1Y": 12.5, "2Y": 17.8, "3Y": 14.8 }, tags: ["international","eafe","europe","asia","developed","diversification"] },
  { ticker: "VXUS", name: "Vanguard Total International Stock ETF", sector: "Broad Market", industry: "Total International", asset_class: "Equity", geo: "Global", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.07, aum: 68000, div_yield: 3.0, perf: { "1D": 0.2, "1W": 0.7, "1M": 2.2, "3M": 3.8, "6M": 6.2, "YTD": 7.8, "1Y": 11.8, "2Y": 15.5, "3Y": 10.2 }, tags: ["international","total international","global","diversification","ex-us"] },
  { ticker: "GLD", name: "SPDR Gold Shares", sector: "Commodities", industry: "Precious Metals", asset_class: "Commodity", geo: "Global", provider: "State Street", risk: "Moderate", esg: false, expense: 0.40, aum: 62000, div_yield: 0.0, perf: { "1D": 0.5, "1W": 1.2, "1M": 3.8, "3M": 8.2, "6M": 12.5, "YTD": 15.2, "1Y": 22.8, "2Y": 28.5, "3Y": 25.2 }, tags: ["gold","precious metals","hedge","inflation","safe haven","commodities","store of value"] },
  { ticker: "SLV", name: "iShares Silver Trust", sector: "Commodities", industry: "Precious Metals", asset_class: "Commodity", geo: "Global", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.50, aum: 11000, div_yield: 0.0, perf: { "1D": 0.8, "1W": 2.1, "1M": 5.2, "3M": 10.5, "6M": 15.8, "YTD": 18.2, "1Y": 28.5, "2Y": 22.1, "3Y": 18.8 }, tags: ["silver","precious metals","industrial metal","commodities","volatile","inflation hedge"] },
  { ticker: "VNQ", name: "Vanguard Real Estate ETF", sector: "Real Estate", industry: "REITs", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.12, aum: 32000, div_yield: 3.8, perf: { "1D": 0.1, "1W": 0.3, "1M": 1.2, "3M": 2.8, "6M": 4.8, "YTD": 6.2, "1Y": 9.8, "2Y": 7.5, "3Y": 10.8 }, tags: ["real estate","reits","income","dividends","property","interest rates"] },
  { ticker: "SCHD", name: "Schwab US Dividend Equity ETF", sector: "Broad Market", industry: "Dividend Focus", asset_class: "Equity", geo: "US", provider: "Schwab", risk: "Moderately Conservative", esg: false, expense: 0.06, aum: 55000, div_yield: 3.5, perf: { "1D": 0.1, "1W": 0.5, "1M": 1.5, "3M": 3.2, "6M": 5.8, "YTD": 7.5, "1Y": 12.2, "2Y": 15.8, "3Y": 22.5 }, tags: ["dividends","income","quality","value","dividend growth","retirement income"] },
  { ticker: "VIG", name: "Vanguard Dividend Appreciation ETF", sector: "Broad Market", industry: "Dividend Growth", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.06, aum: 78000, div_yield: 1.8, perf: { "1D": 0.2, "1W": 0.6, "1M": 1.8, "3M": 3.8, "6M": 6.5, "YTD": 8.8, "1Y": 14.5, "2Y": 22.1, "3Y": 28.2 }, tags: ["dividend growth","quality","blue chip","appreciation","income growth","reliable"] },
  { ticker: "JEPI", name: "JPMorgan Equity Premium Income ETF", sector: "Broad Market", industry: "Covered Call Strategy", asset_class: "Equity", geo: "US", provider: "JPMorgan", risk: "Moderately Conservative", esg: false, expense: 0.35, aum: 33000, div_yield: 7.5, perf: { "1D": 0.1, "1W": 0.4, "1M": 1.2, "3M": 2.5, "6M": 4.8, "YTD": 5.5, "1Y": 8.8, "2Y": 12.2, "3Y": 18.5 }, tags: ["income","covered call","options","premium income","monthly income","high yield equity"] },
  { ticker: "ICLN", name: "iShares Global Clean Energy ETF", sector: "Energy", industry: "Clean Energy", asset_class: "Equity", geo: "Global", provider: "iShares", risk: "Aggressive", esg: true, expense: 0.40, aum: 2800, div_yield: 1.2, perf: { "1D": 0.3, "1W": 0.8, "1M": 2.5, "3M": 5.1, "6M": -2.8, "YTD": 3.2, "1Y": -5.8, "2Y": -18.5, "3Y": -42.1 }, tags: ["clean energy","solar","wind","renewable","esg","green","climate","sustainability"] },
  { ticker: "ESGU", name: "iShares ESG Aware MSCI USA ETF", sector: "Broad Market", industry: "ESG Large Cap", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderate", esg: true, expense: 0.15, aum: 12500, div_yield: 1.2, perf: { "1D": 0.3, "1W": 1.1, "1M": 2.8, "3M": 5.5, "6M": 8.8, "YTD": 11.5, "1Y": 21.2, "2Y": 35.2, "3Y": 38.5 }, tags: ["esg","sustainable","responsible","socially responsible","environmental","governance"] },
  { ticker: "SOXX", name: "iShares Semiconductor ETF", sector: "Technology", industry: "Semiconductors", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.35, aum: 12000, div_yield: 0.6, perf: { "1D": 0.8, "1W": 2.5, "1M": 5.8, "3M": 12.1, "6M": 18.5, "YTD": 22.8, "1Y": 38.5, "2Y": 62.1, "3Y": 52.8 }, tags: ["semiconductors","chips","ai","nvidia","amd","technology","ai infrastructure"] },
  { ticker: "SMH", name: "VanEck Semiconductor ETF", sector: "Technology", industry: "Semiconductors", asset_class: "Equity", geo: "US", provider: "VanEck", risk: "Aggressive", esg: false, expense: 0.35, aum: 18000, div_yield: 0.5, perf: { "1D": 0.9, "1W": 2.6, "1M": 6.1, "3M": 12.8, "6M": 19.2, "YTD": 23.5, "1Y": 40.2, "2Y": 65.5, "3Y": 55.2 }, tags: ["semiconductors","chips","ai","nvidia","tsmc","technology","foundry"] },
  { ticker: "IBB", name: "iShares Biotechnology ETF", sector: "Healthcare", industry: "Biotechnology", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.44, aum: 7200, div_yield: 0.2, perf: { "1D": 0.4, "1W": 1.2, "1M": 3.5, "3M": 5.8, "6M": 8.2, "YTD": 10.5, "1Y": 15.2, "2Y": 12.8, "3Y": -5.8 }, tags: ["biotech","biotechnology","healthcare","pharma","drug development","genomics","medical"] },
  { ticker: "HACK", name: "ETFMG Prime Cyber Security ETF", sector: "Technology", industry: "Cybersecurity", asset_class: "Equity", geo: "US", provider: "ETFMG", risk: "Moderately Aggressive", esg: false, expense: 0.60, aum: 1800, div_yield: 0.1, perf: { "1D": 0.4, "1W": 1.3, "1M": 3.2, "3M": 6.5, "6M": 10.8, "YTD": 14.2, "1Y": 22.5, "2Y": 32.8, "3Y": 28.5 }, tags: ["cybersecurity","security","hacking","data protection","technology","defense","cloud security"] },
  { ticker: "BOTZ", name: "Global X Robotics & AI ETF", sector: "Technology", industry: "Robotics & AI", asset_class: "Equity", geo: "Global", provider: "Global X", risk: "Aggressive", esg: false, expense: 0.68, aum: 2500, div_yield: 0.2, perf: { "1D": 0.6, "1W": 1.8, "1M": 4.5, "3M": 9.2, "6M": 14.8, "YTD": 18.5, "1Y": 28.2, "2Y": 35.8, "3Y": 22.5 }, tags: ["robotics","ai","artificial intelligence","automation","machine learning","future tech"] },
  { ticker: "KWEB", name: "KraneShares CSI China Internet ETF", sector: "Technology", industry: "China Internet", asset_class: "Equity", geo: "Emerging Markets", provider: "KraneShares", risk: "Aggressive", esg: false, expense: 0.69, aum: 5200, div_yield: 0.5, perf: { "1D": 1.2, "1W": 3.5, "1M": 8.2, "3M": 15.5, "6M": 22.1, "YTD": 18.8, "1Y": 25.2, "2Y": -5.8, "3Y": -35.2 }, tags: ["china","internet","alibaba","tencent","emerging","asia","chinese tech"] },
  { ticker: "SHY", name: "iShares 1-3 Year Treasury Bond ETF", sector: "Fixed Income", industry: "Short-Term Treasury", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.15, aum: 28000, div_yield: 3.8, perf: { "1D": 0.0, "1W": 0.0, "1M": 0.2, "3M": 0.8, "6M": 1.5, "YTD": 1.8, "1Y": 4.2, "2Y": 6.5, "3Y": 2.8 }, tags: ["short term","treasury","safe","conservative","cash alternative","low risk","money market"] },
  { ticker: "TIP", name: "iShares TIPS Bond ETF", sector: "Fixed Income", industry: "Inflation Protected", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.19, aum: 19000, div_yield: 4.5, perf: { "1D": 0.0, "1W": 0.1, "1M": 0.5, "3M": 1.2, "6M": 2.2, "YTD": 2.8, "1Y": 4.8, "2Y": 3.2, "3Y": -3.8 }, tags: ["tips","inflation","inflation protection","treasury","real return","conservative"] },
  { ticker: "DBA", name: "Invesco DB Agriculture Fund", sector: "Commodities", industry: "Agriculture", asset_class: "Commodity", geo: "Global", provider: "Invesco", risk: "Moderately Aggressive", esg: false, expense: 0.85, aum: 820, div_yield: 0.0, perf: { "1D": -0.2, "1W": 0.5, "1M": 1.8, "3M": 3.2, "6M": 5.5, "YTD": 4.8, "1Y": 8.2, "2Y": 5.5, "3Y": 18.5 }, tags: ["agriculture","farming","food","commodities","corn","wheat","soybeans","crop"] },
  { ticker: "IBIT", name: "iShares Bitcoin Trust ETF", sector: "Digital Assets", industry: "Cryptocurrency", asset_class: "Crypto", geo: "Global", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.25, aum: 48000, div_yield: 0.0, perf: { "1D": 2.5, "1W": 8.2, "1M": 15.5, "3M": 28.2, "6M": 45.8, "YTD": 52.1, "1Y": 120.5, "2Y": 180.2, "3Y": 85.5 }, tags: ["bitcoin","crypto","cryptocurrency","digital assets","blockchain","btc","web3"] },
  { ticker: "ETHE", name: "iShares Ethereum Trust ETF", sector: "Digital Assets", industry: "Cryptocurrency", asset_class: "Crypto", geo: "Global", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.25, aum: 8500, div_yield: 0.0, perf: { "1D": 3.2, "1W": 10.5, "1M": 18.2, "3M": 25.5, "6M": 35.2, "YTD": 42.8, "1Y": 85.2, "2Y": 110.5, "3Y": 45.2 }, tags: ["ethereum","crypto","cryptocurrency","defi","smart contracts","blockchain","eth","web3"] },
];

// ─── Pre-computed interest mappings ───
const INTEREST_MAPPINGS = [
  { keywords: ["ai","artificial intelligence","machine learning","deep learning"], tags: ["ai","artificial intelligence","machine learning","automation"], label: "Artificial Intelligence" },
  { keywords: ["bitcoin","crypto","cryptocurrency","blockchain","web3","defi","digital currency"], tags: ["bitcoin","crypto","cryptocurrency","blockchain","web3","defi","digital assets"], label: "Cryptocurrency" },
  { keywords: ["clean energy","solar","wind","renewable","green energy","climate"], tags: ["clean energy","solar","wind","renewable","green","climate","sustainability"], label: "Clean Energy" },
  { keywords: ["dividend","income","yield","passive income","cash flow"], tags: ["dividends","income","dividend growth","monthly income","high yield"], label: "Dividend Income" },
  { keywords: ["tech","technology","software","cloud","saas"], tags: ["tech","software","cloud","information technology","growth"], label: "Technology" },
  { keywords: ["semiconductor","chips","chipmaker","foundry"], tags: ["semiconductors","chips","ai infrastructure","foundry"], label: "Semiconductors" },
  { keywords: ["gold","silver","precious metal","safe haven"], tags: ["gold","silver","precious metals","safe haven","inflation hedge"], label: "Precious Metals" },
  { keywords: ["bond","treasury","fixed income","safe","conservative","low risk"], tags: ["bonds","treasury","fixed income","conservative","safe","core bond"], label: "Bonds & Fixed Income" },
  { keywords: ["healthcare","medical","pharma","biotech","drug","genomics"], tags: ["healthcare","pharma","biotech","medical","genomics","drug development"], label: "Healthcare & Biotech" },
  { keywords: ["real estate","property","reit","housing","commercial property"], tags: ["real estate","reits","property","income"], label: "Real Estate" },
  { keywords: ["emerging","china","india","brazil","developing","frontier"], tags: ["emerging markets","china","india","developing","frontier"], label: "Emerging Markets" },
  { keywords: ["international","global","foreign","overseas","world","ex-us"], tags: ["international","global","diversification","ex-us"], label: "International Markets" },
  { keywords: ["cybersecurity","security","hacking","data protection","cyber"], tags: ["cybersecurity","security","data protection","cloud security"], label: "Cybersecurity" },
  { keywords: ["robotics","robot","automation","autonomous","self driving"], tags: ["robotics","automation","autonomous","machine learning","future tech"], label: "Robotics & Automation" },
  { keywords: ["esg","sustainable","responsible","environmental","governance","social"], tags: ["esg","sustainable","responsible","environmental","governance"], label: "ESG & Sustainability" },
  { keywords: ["energy","oil","gas","petroleum","fossil fuel"], tags: ["energy","oil","gas","commodities"], label: "Oil & Gas Energy" },
  { keywords: ["agriculture","farming","food","crop","grain","wheat","corn"], tags: ["agriculture","farming","food","commodities","crop"], label: "Agriculture" },
  { keywords: ["inflation","inflation protection","real return","purchasing power"], tags: ["inflation","inflation protection","tips","real return"], label: "Inflation Protection" },
  { keywords: ["retirement","401k","ira","long term","nest egg","pension"], tags: ["retirement","core holding","passive","broad market","retirement income"], label: "Retirement Planning" },
  { keywords: ["small cap","small company","micro cap","russell 2000"], tags: ["small cap","russell 2000","growth potential","value hunting"], label: "Small Cap" },
  { keywords: ["large cap","blue chip","mega cap","established"], tags: ["large cap","blue chip","mega cap","core holding"], label: "Large Cap / Blue Chip" },
  { keywords: ["value","undervalued","bargain","cheap","contrarian"], tags: ["value","undervalued","contrarian","value hunting"], label: "Value Investing" },
  { keywords: ["growth","momentum","high growth","fast growing"], tags: ["growth","momentum","innovation","fast growing"], label: "Growth" },
  { keywords: ["index","passive","s&p","total market","buy and hold"], tags: ["index","passive","s&p 500","total market","broad market"], label: "Index / Passive Investing" },
  { keywords: ["innovation","disruptive","future","next gen","cutting edge"], tags: ["innovation","disruptive","future tech","cutting edge"], label: "Disruptive Innovation" },
  { keywords: ["infrastructure","construction","building","bridges","roads"], tags: ["infrastructure","construction","industrials","manufacturing"], label: "Infrastructure" },
  { keywords: ["financial","bank","insurance","fintech","lending"], tags: ["financials","banks","insurance","banking","fintech"], label: "Financials & Banking" },
  { keywords: ["space","aerospace","defense","military","satellite"], tags: ["aerospace","defense","space"], label: "Aerospace & Defense" },
  { keywords: ["low cost","cheap etf","low fee","no fee","low expense"], tags: ["low cost","passive","index"], label: "Low Cost ETFs" },
];

// ─── Constants ───
const PERF_RANGES = ["1D","1W","1M","3M","6M","YTD","1Y","2Y","3Y"];
const SECTORS = [...new Set(ETF_DATA.map(e => e.sector))].sort();
const INDUSTRIES_BY_SECTOR = {};
ETF_DATA.forEach(e => {
  if (!INDUSTRIES_BY_SECTOR[e.sector]) INDUSTRIES_BY_SECTOR[e.sector] = new Set();
  INDUSTRIES_BY_SECTOR[e.sector].add(e.industry);
});
const RISK_CATEGORIES = ["Conservative","Moderately Conservative","Moderate","Moderately Aggressive","Aggressive"];
const ASSET_CLASSES = [...new Set(ETF_DATA.map(e => e.asset_class))].sort();
const GEO_OPTIONS = [...new Set(ETF_DATA.map(e => e.geo))].sort();
const PROVIDERS = [...new Set(ETF_DATA.map(e => e.provider))].sort();

// ─── Utility Components ───
const fmt = (n) => (n >= 0 ? "+" : "") + n.toFixed(1) + "%";
const fmtAum = (n) => {
  if (n >= 1000000) return "$" + (n/1000000).toFixed(1) + "T";
  if (n >= 1000) return "$" + (n/1000).toFixed(1) + "B";
  return "$" + n + "M";
};

// ─── Performance Preset Options ───
const PERF_PRESETS = [
  { key: "any", label: "Any performance", min: -Infinity, max: Infinity },
  { key: "positive", label: "Positive (> 0%)", min: 0.01, max: Infinity },
  { key: "negative", label: "Negative (< 0%)", min: -Infinity, max: -0.01 },
  { key: "up_0_10", label: "Up 0% – 10%", min: 0, max: 10 },
  { key: "up_10_25", label: "Up 10% – 25%", min: 10, max: 25 },
  { key: "up_25_50", label: "Up 25% – 50%", min: 25, max: 50 },
  { key: "up_50", label: "Up 50%+", min: 50, max: Infinity },
  { key: "down_0_10", label: "Down 0% – 10%", min: -10, max: 0 },
  { key: "down_10_25", label: "Down 10% – 25%", min: -25, max: -10 },
  { key: "down_25", label: "Down 25%+", min: -Infinity, max: -25 },
  { key: "custom", label: "Custom range...", min: null, max: null },
];

function PerfDropdown({ label, value, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [customMin, setCustomMin] = useState("");
  const [customMax, setCustomMax] = useState("");
  const ref = useRef(null);
  const isCustom = value.key === "custom";

  useEffect(() => {
    const handleClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSelect = (preset) => {
    if (preset.key === "custom") {
      onChange({ key: "custom", min: customMin === "" ? -Infinity : +customMin, max: customMax === "" ? Infinity : +customMax });
    } else {
      onChange(preset);
    }
    if (preset.key !== "custom") setIsOpen(false);
  };

  const handleCustomApply = () => {
    onChange({ key: "custom", min: customMin === "" ? -Infinity : +customMin, max: customMax === "" ? Infinity : +customMax });
    setIsOpen(false);
  };

  const displayLabel = isCustom
    ? `Custom: ${customMin === "" ? "any" : customMin + "%"} to ${customMax === "" ? "any" : customMax + "%"}`
    : value.label;

  const isActive = value.key !== "any";

  return (
    <div ref={ref} style={{ marginBottom: 10, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-muted)", width: 32, fontFamily: "'JetBrains Mono', monospace" }}>{label}</span>
        <button onClick={() => setIsOpen(!isOpen)} style={{
          flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: 500,
          border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
          background: isActive ? "var(--accent-light)" : "var(--surface)",
          color: isActive ? "var(--accent)" : "var(--text-secondary)",
          cursor: "pointer", fontFamily: "'DM Sans', sans-serif", textAlign: "left",
          transition: "all 0.15s ease",
        }}>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{displayLabel}</span>
          <span style={{ fontSize: 10, marginLeft: 8, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s ease", flexShrink: 0 }}>▾</span>
        </button>
        {isActive && (
          <button onClick={(e) => { e.stopPropagation(); onChange(PERF_PRESETS[0]); setCustomMin(""); setCustomMax(""); }}
            style={{
              background: "none", border: "none", cursor: "pointer", fontSize: 14,
              color: "var(--text-muted)", padding: "2px 4px", lineHeight: 1, flexShrink: 0,
            }}>×</button>
        )}
      </div>

      {isOpen && (
        <div style={{
          position: "absolute", left: 40, right: 0, top: "100%", zIndex: 50,
          background: "var(--surface)", border: "1.5px solid var(--border)", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,0.1)", overflow: "hidden",
          animation: "fadeIn 0.12s ease",
        }}>
          {PERF_PRESETS.filter(p => p.key !== "custom").map(preset => (
            <button key={preset.key} onClick={() => handleSelect(preset)} style={{
              width: "100%", padding: "9px 14px", border: "none", background: value.key === preset.key ? "var(--accent-light)" : "transparent",
              color: value.key === preset.key ? "var(--accent)" : "var(--text-secondary)",
              fontSize: 12, fontWeight: value.key === preset.key ? 600 : 400, textAlign: "left",
              cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
              borderBottom: "1px solid var(--border)",
            }}
              onMouseEnter={e => { if (value.key !== preset.key) e.target.style.background = "var(--surface-hover)"; }}
              onMouseLeave={e => { if (value.key !== preset.key) e.target.style.background = "transparent"; }}
            >{preset.label}</button>
          ))}
          {/* Custom range section */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid var(--border)", background: "var(--bg)" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", marginBottom: 8 }}>Custom range</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input type="number" placeholder="Min %" value={customMin}
                onChange={e => setCustomMin(e.target.value)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6, border: "1.5px solid var(--border)",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none",
                  background: "var(--surface)", color: "var(--text-primary)", width: "100%",
                }} />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>to</span>
              <input type="number" placeholder="Max %" value={customMax}
                onChange={e => setCustomMax(e.target.value)}
                style={{
                  flex: 1, padding: "6px 8px", borderRadius: 6, border: "1.5px solid var(--border)",
                  fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none",
                  background: "var(--surface)", color: "var(--text-primary)", width: "100%",
                }} />
              <button onClick={handleCustomApply} style={{
                padding: "6px 12px", borderRadius: 6, border: "none",
                background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 600,
                cursor: "pointer", fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
              }}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, multi = true }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button key={opt} onClick={() => onToggle(opt)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: active ? "var(--accent-light)" : "var(--surface)",
              color: active ? "var(--accent)" : "var(--text-muted)",
              cursor: "pointer", transition: "all 0.15s ease",
              fontFamily: "'DM Sans', sans-serif",
            }}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function FilterSection({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, marginBottom: 12 }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "none", border: "none", cursor: "pointer", padding: "6px 0", fontFamily: "'DM Sans', sans-serif",
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.02em" }}>{title}</span>
        <span style={{ fontSize: 16, color: "var(--text-muted)", transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }}>▾</span>
      </button>
      {open && <div style={{ paddingTop: 8 }}>{children}</div>}
    </div>
  );
}

// ─── Disclosure Modal ───
function DisclosureModal({ onClose }) {
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
      animation: "fadeIn 0.2s ease",
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--bg)", borderRadius: 16, padding: "36px 40px", maxWidth: 640,
        width: "90%", maxHeight: "80vh", overflowY: "auto", boxShadow: "0 24px 80px rgba(0,0,0,0.15)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
            Disclosures & Important Information
          </h2>
          <button onClick={onClose} style={{
            background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
            width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--text-muted)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>×</button>
        </div>
        {[
          { t: "Not Investment Advice", p: "This application is provided for informational and educational purposes only. Nothing presented here constitutes investment advice, financial advice, trading advice, or any other form of professional advice. The information should not be relied upon for making investment decisions." },
          { t: "No Fiduciary Relationship", p: "Use of this application does not create a fiduciary, advisory, or professional relationship between you and the creator of this application. The creator is not a registered investment advisor, broker-dealer, or financial planner." },
          { t: "Past Performance", p: "Past performance is not indicative of future results. Historical returns, expected returns, and probability projections are provided for informational purposes and may not reflect actual future performance. All investments involve risk, including the possible loss of principal." },
          { t: "Data Accuracy", p: "While we strive to provide accurate and up-to-date information, the data presented may contain errors, omissions, or delays. ETF data is sourced from publicly available information and is refreshed periodically. Real-time accuracy is not guaranteed." },
          { t: "Consult a Professional", p: "Before making any investment decisions, you should consult with a qualified financial advisor, tax professional, or other appropriate professional who can consider your specific circumstances, risk tolerance, and financial goals." },
          { t: "Technology Demonstration", p: "This application is primarily a technology demonstration showcasing modern web development techniques. It is not intended to serve as a comprehensive investment research platform or to replace professional-grade financial tools." },
          { t: "Third-Party Data", p: "ETF information, including performance data, expense ratios, and holdings information, is derived from publicly available sources. The creator does not guarantee the completeness or timeliness of this data." },
          { t: "Risk of Loss", p: "Investing in ETFs involves risk, including the potential loss of principal. Different types of ETFs carry different levels of risk. Leveraged and inverse ETFs, sector-specific ETFs, and international ETFs may carry additional risks not present in broad-market index ETFs." },
        ].map(({ t, p }, i) => (
          <div key={i} style={{ marginBottom: 20 }}>
            <h3 style={{ margin: "0 0 6px", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif" }}>{t}</h3>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.65, color: "var(--text-muted)" }}>{p}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main App ───
export default function ETFFinderApp() {
  const [sectors, setSectors] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [riskCats, setRiskCats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [matchedInterests, setMatchedInterests] = useState([]);
  const [perfFilters, setPerfFilters] = useState(
    Object.fromEntries(PERF_RANGES.map(r => [r, PERF_PRESETS[0]]))
  );
  const [sortCol, setSortCol] = useState("ticker");
  const [sortDir, setSortDir] = useState("asc");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [etfPackage, setEtfPackage] = useState([]);
  const [detailETF, setDetailETF] = useState(null);
  const [expandedTicker, setExpandedTicker] = useState(null);
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const PAGE_SIZE = 12;

  const toggleChip = useCallback((list, setList) => (val) => {
    setList(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]);
    setPage(0);
  }, []);

  // Interest search
  useEffect(() => {
    if (!searchText.trim()) { setMatchedInterests([]); return; }
    const lower = searchText.toLowerCase();
    const matches = INTEREST_MAPPINGS.filter(m =>
      m.keywords.some(k => lower.includes(k) || k.includes(lower))
    );
    setMatchedInterests(matches);
  }, [searchText]);

  const availableIndustries = useMemo(() => {
    if (sectors.length === 0) return [...new Set(ETF_DATA.map(e => e.industry))].sort();
    const indSet = new Set();
    sectors.forEach(s => { (INDUSTRIES_BY_SECTOR[s] || new Set()).forEach(i => indSet.add(i)); });
    return [...indSet].sort();
  }, [sectors]);

  // Filter
  const filtered = useMemo(() => {
    return ETF_DATA.filter(etf => {
      if (sectors.length > 0 && !sectors.includes(etf.sector)) return false;
      if (industries.length > 0 && !industries.includes(etf.industry)) return false;
      if (riskCats.length > 0 && !riskCats.includes(etf.risk)) return false;
      for (const range of PERF_RANGES) {
        const pf = perfFilters[range];
        if (pf.key === "any") continue;
        const val = etf.perf[range];
        if (pf.min !== null && pf.min !== -Infinity && val < pf.min) return false;
        if (pf.max !== null && pf.max !== Infinity && val > pf.max) return false;
        if (pf.key === "positive" && val <= 0) return false;
        if (pf.key === "negative" && val >= 0) return false;
      }
      if (matchedInterests.length > 0) {
        const allTags = matchedInterests.flatMap(m => m.tags);
        const hasMatch = etf.tags.some(t => allTags.some(mt => t.includes(mt) || mt.includes(t)));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [sectors, industries, riskCats, perfFilters, matchedInterests]);

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let av, bv;
      if (sortCol === "ticker" || sortCol === "name" || sortCol === "sector" || sortCol === "risk") {
        av = a[sortCol]; bv = b[sortCol];
        return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (sortCol === "expense" || sortCol === "aum" || sortCol === "div_yield") {
        av = a[sortCol]; bv = b[sortCol];
      } else {
        av = a.perf[sortCol] || 0; bv = b.perf[sortCol] || 0;
      }
      return sortDir === "asc" ? av - bv : bv - av;
    });
  }, [filtered, sortCol, sortDir]);

  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);

  const handleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const clearAll = () => {
    setSectors([]); setIndustries([]); setRiskCats([]);
    setSearchText(""); setMatchedInterests([]);
    setPerfFilters(Object.fromEntries(PERF_RANGES.map(r => [r, PERF_PRESETS[0]])));
    setPage(0);
  };

  const addToPackage = (etf) => {
    if (!etfPackage.find(e => e.ticker === etf.ticker)) {
      setEtfPackage(prev => [...prev, etf]);
    }
  };
  const removeFromPackage = (ticker) => {
    setEtfPackage(prev => prev.filter(e => e.ticker !== ticker));
    if (detailETF?.ticker === ticker) setDetailETF(null);
  };
  const isInPackage = (ticker) => etfPackage.some(e => e.ticker === ticker);

  // Package-level aggregate stats
  const packageStats = useMemo(() => {
    if (etfPackage.length === 0) return null;
    const avgExpense = etfPackage.reduce((s, e) => s + e.expense, 0) / etfPackage.length;
    const avgDivYield = etfPackage.reduce((s, e) => s + e.div_yield, 0) / etfPackage.length;
    const totalAum = etfPackage.reduce((s, e) => s + e.aum, 0);
    const avgPerf = {};
    PERF_RANGES.forEach(r => {
      avgPerf[r] = etfPackage.reduce((s, e) => s + e.perf[r], 0) / etfPackage.length;
    });
    const sectors = [...new Set(etfPackage.map(e => e.sector))];
    const risks = [...new Set(etfPackage.map(e => e.risk))];
    return { avgExpense, avgDivYield, totalAum, avgPerf, sectors, risks };
  }, [etfPackage]);

  const SortHeader = ({ col, label, width, mono }) => (
    <th onClick={() => handleSort(col)} style={{
      padding: "10px 12px", textAlign: col === "ticker" || col === "name" || col === "sector" || col === "risk" ? "left" : "right",
      cursor: "pointer", userSelect: "none", whiteSpace: "nowrap", fontSize: 11, fontWeight: 600,
      color: sortCol === col ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em",
      textTransform: "uppercase", width: width || "auto", position: "sticky", top: 0,
      background: "var(--surface)", borderBottom: "2px solid var(--border)", zIndex: 2,
      fontFamily: mono ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
    }}>
      {label} {sortCol === col ? (sortDir === "asc" ? "↑" : "↓") : ""}
    </th>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700&family=Outfit:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
        :root {
          --bg: #FAFBFD; --surface: #FFFFFF; --surface-hover: #F4F6FA;
          --border: #E2E6EF; --border-strong: #CBD1DE;
          --text-primary: #1A1F36; --text-secondary: #3C4257; --text-muted: #8792A8;
          --accent: #4F6EF7; --accent-light: #EEF1FE; --accent-dark: #3B57D9;
          --green: #0E9F6E; --green-bg: #ECFDF5;
          --red: #E02D3C; --red-bg: #FEF2F2;
          --amber: #D97706; --amber-bg: #FFFBEB;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: var(--bg); font-family: 'DM Sans', sans-serif; color: var(--text-primary); }
        input[type="range"] { height: 4px; border-radius: 2px; }
        input[type="range"]::-webkit-slider-thumb { width: 16px; height: 16px; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .etf-row:hover { background: var(--surface-hover) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
      `}</style>

      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* ─── Header ─── */}
        <header style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #818CF8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 16, fontFamily: "'Outfit', sans-serif",
            }}>E</div>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "var(--text-primary)", lineHeight: 1.1 }}>
                ETF Finder
              </h1>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Discover and compare exchange-traded funds
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{
              background: "var(--accent-light)", color: "var(--accent)", fontSize: 12, fontWeight: 600,
              padding: "4px 12px", borderRadius: 20,
            }}>
              {filtered.length} ETFs
            </span>
            {etfPackage.length > 0 && (
              <span style={{
                background: "var(--green-bg)", color: "var(--green)", fontSize: 12, fontWeight: 600,
                padding: "4px 12px", borderRadius: 20,
              }}>
                {etfPackage.length} in package
              </span>
            )}
            <button onClick={() => setSidebarOpen(s => !s)} style={{
              background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8,
              padding: "6px 14px", fontSize: 13, cursor: "pointer", color: "var(--text-secondary)",
              fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            }}>
              {sidebarOpen ? "Hide Filters" : "Show Filters"}
            </button>
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          
          {/* ─── Sidebar ─── */}
          {sidebarOpen && (
            <aside style={{
              width: 320, minWidth: 320, background: "var(--surface)", borderRight: "1px solid var(--border)",
              padding: "20px 20px 100px", overflowY: "auto", animation: "fadeIn 0.2s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>Filters</span>
                <button onClick={clearAll} style={{
                  background: "none", border: "none", color: "var(--accent)", fontSize: 12,
                  fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                }}>Clear all</button>
              </div>

              {/* Interest Search */}
              <FilterSection title="Search by Interest" defaultOpen={true}>
                <div style={{ position: "relative", marginBottom: 8 }}>
                  <input
                    type="text" value={searchText} onChange={e => { setSearchText(e.target.value); setPage(0); }}
                    placeholder="e.g. AI, clean energy, retirement..."
                    style={{
                      width: "100%", padding: "10px 14px 10px 36px", borderRadius: 10,
                      border: "1.5px solid var(--border)", fontSize: 13, outline: "none",
                      background: "var(--bg)", color: "var(--text-primary)",
                      fontFamily: "'DM Sans', sans-serif", transition: "border-color 0.15s ease",
                    }}
                    onFocus={e => e.target.style.borderColor = "var(--accent)"}
                    onBlur={e => e.target.style.borderColor = "var(--border)"}
                  />
                  <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, color: "var(--text-muted)" }}>⌕</span>
                </div>
                {matchedInterests.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {matchedInterests.map(m => (
                      <span key={m.label} style={{
                        fontSize: 11, background: "var(--green-bg)", color: "var(--green)",
                        padding: "3px 10px", borderRadius: 12, fontWeight: 600,
                      }}>✓ {m.label}</span>
                    ))}
                  </div>
                )}
              </FilterSection>

              {/* Risk Category */}
              <FilterSection title="Risk Category" defaultOpen={true}>
                <ChipSelect options={RISK_CATEGORIES} selected={riskCats} onToggle={toggleChip(riskCats, setRiskCats)} />
              </FilterSection>

              {/* Sector */}
              <FilterSection title="Sector" defaultOpen={true}>
                <ChipSelect options={SECTORS} selected={sectors} onToggle={(val) => {
                  const next = sectors.includes(val) ? sectors.filter(v => v !== val) : [...sectors, val];
                  setSectors(next); setPage(0);
                  if (next.length > 0) {
                    const valid = new Set();
                    next.forEach(s => (INDUSTRIES_BY_SECTOR[s] || new Set()).forEach(i => valid.add(i)));
                    setIndustries(prev => prev.filter(i => valid.has(i)));
                  }
                }} />
              </FilterSection>

              {/* Industry */}
              <FilterSection title="Industry" defaultOpen={false}>
                <ChipSelect options={availableIndustries} selected={industries} onToggle={toggleChip(industries, setIndustries)} />
              </FilterSection>

              {/* Performance */}
              <FilterSection title="Performance Ranges" defaultOpen={false}>
                {PERF_RANGES.map(range => (
                  <PerfDropdown key={range} label={range}
                    value={perfFilters[range]}
                    onChange={v => { setPerfFilters(prev => ({ ...prev, [range]: v })); setPage(0); }} />
                ))}
              </FilterSection>
            </aside>
          )}

          {/* ─── Results ─── */}
          <main style={{ flex: 1, padding: "16px 20px", overflowY: "auto", overflowX: "hidden", display: "flex", flexDirection: "column", gap: 16 }}>

            {/* ═══ SECTION 1: Search Results ═══ */}
            <div style={{
              background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)",
              overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", flex: "1 1 auto",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "var(--surface)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
                    Search Results
                  </span>
                  <span style={{
                    background: "var(--bg)", color: "var(--text-muted)", fontSize: 11, fontWeight: 600,
                    padding: "2px 10px", borderRadius: 12, border: "1px solid var(--border)",
                  }}>{sorted.length}</span>
                </div>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Click row to expand · Click + to add</span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 820 }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: "8px 12px", width: 44, background: "var(--surface)",
                        borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2,
                      }}></th>
                      <SortHeader col="ticker" label="Ticker" width="72px" />
                      <SortHeader col="name" label="Name" width="220px" />
                      <SortHeader col="sector" label="Sector" />
                      <SortHeader col="risk" label="Risk" />
                      <SortHeader col="expense" label="Exp." mono />
                      <SortHeader col="div_yield" label="Yield" mono />
                      <SortHeader col="1Y" label="1Y" mono />
                      <SortHeader col="YTD" label="YTD" mono />
                    </tr>
                  </thead>
                  <tbody>
                    {paged.length === 0 ? (
                      <tr><td colSpan={9} style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                        No ETFs match your current filters. Try broadening your criteria.
                      </td></tr>
                    ) : paged.map((etf, i) => {
                      const inPkg = isInPackage(etf.ticker);
                      const isExpanded = expandedTicker === etf.ticker;
                      return (
                        <React.Fragment key={etf.ticker}>
                          <tr className="etf-row"
                            onClick={() => setExpandedTicker(isExpanded ? null : etf.ticker)}
                            style={{
                              borderBottom: isExpanded ? "none" : "1px solid var(--border)",
                              background: inPkg ? "var(--accent-light)" : "transparent",
                              animation: `slideUp 0.12s ease ${i * 0.015}s both`,
                              cursor: "pointer",
                            }}>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}
                              onClick={e => e.stopPropagation()}>
                              <button onClick={() => inPkg ? removeFromPackage(etf.ticker) : addToPackage(etf)}
                                style={{
                                  width: 26, height: 26, borderRadius: 8, border: "none",
                                  background: inPkg ? "var(--accent)" : "var(--bg)",
                                  color: inPkg ? "#fff" : "var(--accent)",
                                  cursor: "pointer", fontSize: 14, fontWeight: 700,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  transition: "all 0.15s ease",
                                  boxShadow: inPkg ? "none" : "inset 0 0 0 1.5px var(--border)",
                                }}
                                title={inPkg ? "Remove from package" : "Add to package"}
                              >{inPkg ? "✓" : "+"}</button>
                            </td>
                            <td style={{ padding: "8px 12px", fontWeight: 700, fontSize: 12, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                              {etf.ticker}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>
                              {etf.name}
                            </td>
                            <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)" }}>{etf.sector}</td>
                            <td style={{ padding: "8px 12px" }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                                background: etf.risk === "Conservative" ? "var(--green-bg)" :
                                           etf.risk === "Aggressive" ? "var(--red-bg)" :
                                           etf.risk === "Moderate" ? "var(--accent-light)" : "var(--amber-bg)",
                                color: etf.risk === "Conservative" ? "var(--green)" :
                                       etf.risk === "Aggressive" ? "var(--red)" :
                                       etf.risk === "Moderate" ? "var(--accent)" : "var(--amber)",
                              }}>{etf.risk.replace("Moderately ", "Mod. ")}</span>
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }}>
                              {etf.expense.toFixed(2)}%
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }}>
                              {etf.div_yield.toFixed(1)}%
                            </td>
                            <td style={{
                              padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11, fontWeight: 600,
                              color: etf.perf["1Y"] >= 0 ? "var(--green)" : "var(--red)",
                            }}>{fmt(etf.perf["1Y"])}</td>
                            <td style={{
                              padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                              fontSize: 11, fontWeight: 600,
                              color: etf.perf["YTD"] >= 0 ? "var(--green)" : "var(--red)",
                            }}>
                              <span>{fmt(etf.perf["YTD"])}</span>
                              <span style={{
                                marginLeft: 8, fontSize: 10, color: "var(--text-muted)",
                                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                                display: "inline-block", transition: "transform 0.2s ease",
                              }}>▾</span>
                            </td>
                          </tr>

                          {/* ── Expanded Detail Row ── */}
                          {isExpanded && (
                            <tr style={{ animation: "slideUp 0.15s ease" }}>
                              <td colSpan={9} style={{
                                padding: 0, borderBottom: "1px solid var(--border)",
                                background: "var(--bg)",
                              }}>
                                <div style={{ padding: "16px 20px" }}>
                                  {/* Top row: info + add button */}
                                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                                    <div>
                                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                                        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                                          {etf.ticker}
                                        </span>
                                        <span style={{
                                          fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
                                          background: "var(--accent-light)", color: "var(--accent)",
                                        }}>{etf.asset_class}</span>
                                        {etf.esg && <span style={{
                                          fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
                                          background: "var(--green-bg)", color: "var(--green)",
                                        }}>ESG</span>}
                                      </div>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{etf.name}</p>
                                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                                        {etf.provider} · {etf.sector} · {etf.industry} · {etf.geo}
                                      </p>
                                    </div>
                                    <button
                                      onClick={(e) => { e.stopPropagation(); inPkg ? removeFromPackage(etf.ticker) : addToPackage(etf); }}
                                      style={{
                                        padding: "7px 18px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                                        border: "none", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                                        background: inPkg ? "var(--red-bg)" : "var(--accent)",
                                        color: inPkg ? "var(--red)" : "#fff",
                                        transition: "all 0.15s ease",
                                      }}>
                                      {inPkg ? "Remove from package" : "Add to package"}
                                    </button>
                                  </div>

                                  {/* Key Metrics */}
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 14 }}>
                                    {[
                                      { label: "Expense Ratio", value: etf.expense.toFixed(2) + "%" },
                                      { label: "AUM", value: fmtAum(etf.aum) },
                                      { label: "Div. Yield", value: etf.div_yield.toFixed(1) + "%" },
                                      { label: "Risk Level", value: etf.risk },
                                    ].map(({ label, value }) => (
                                      <div key={label} style={{
                                        background: "var(--surface)", borderRadius: 8, padding: "9px 11px",
                                        border: "1px solid var(--border)",
                                      }}>
                                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                                      </div>
                                    ))}
                                  </div>

                                  {/* Performance Grid */}
                                  <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Performance</div>
                                  <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5, marginBottom: 12 }}>
                                    {PERF_RANGES.map(r => {
                                      const v = etf.perf[r];
                                      return (
                                        <div key={r} style={{
                                          background: v >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                                          borderRadius: 7, padding: "7px 4px", textAlign: "center",
                                        }}>
                                          <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2 }}>{r}</div>
                                          <div style={{
                                            fontSize: 11, fontWeight: 700,
                                            fontFamily: "'JetBrains Mono', monospace",
                                            color: v >= 0 ? "var(--green)" : "var(--red)",
                                          }}>{fmt(v)}</div>
                                        </div>
                                      );
                                    })}
                                  </div>

                                  {/* Tags */}
                                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                                    {etf.tags.map(t => (
                                      <span key={t} style={{
                                        fontSize: 10, color: "var(--text-muted)", background: "var(--surface)",
                                        border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10,
                                      }}>#{t}</span>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 16px", borderTop: "1px solid var(--border)", background: "var(--surface)",
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button disabled={page === 0} onClick={() => setPage(p => p - 1)}
                      style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                        background: "var(--surface)", cursor: page === 0 ? "default" : "pointer",
                        fontSize: 11, fontWeight: 500, color: page === 0 ? "var(--border-strong)" : "var(--text-secondary)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>← Prev</button>
                    <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}
                      style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                        background: "var(--surface)", cursor: page >= totalPages - 1 ? "default" : "pointer",
                        fontSize: 11, fontWeight: 500, color: page >= totalPages - 1 ? "var(--border-strong)" : "var(--text-secondary)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>Next →</button>
                  </div>
                </div>
              )}
            </div>

            {/* ═══ SECTION 2: Selected Package ═══ */}
            <div style={{
              background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)",
              overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
                    Your ETF Package
                  </span>
                  {etfPackage.length > 0 && (
                    <span style={{
                      background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 10, minWidth: 20, textAlign: "center",
                    }}>{etfPackage.length}</span>
                  )}
                </div>
                {etfPackage.length > 0 && (
                  <button onClick={() => { setEtfPackage([]); setDetailETF(null); }} style={{
                    background: "none", border: "none", color: "var(--red)", fontSize: 11,
                    fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>Clear package</button>
                )}
              </div>

              {etfPackage.length === 0 ? (
                <div style={{ padding: "28px 16px", textAlign: "center" }}>
                  <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.3 }}>📦</div>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    No ETFs selected yet. Use the + button above to build your package.
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 14 }}>
                  {etfPackage.map(etf => {
                    const isActive = detailETF?.ticker === etf.ticker;
                    return (
                      <div key={etf.ticker}
                        onClick={() => setDetailETF(isActive ? null : etf)}
                        style={{
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "10px 14px", borderRadius: 10, cursor: "pointer",
                          border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                          background: isActive ? "var(--accent-light)" : "var(--bg)",
                          transition: "all 0.15s ease", minWidth: 180, flex: "0 1 auto",
                        }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                              {etf.ticker}
                            </span>
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: etf.perf["1Y"] >= 0 ? "var(--green)" : "var(--red)",
                              fontFamily: "'JetBrains Mono', monospace",
                            }}>{fmt(etf.perf["1Y"])}</span>
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
                            {etf.name}
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); removeFromPackage(etf.ticker); }}
                          style={{
                            width: 22, height: 22, borderRadius: 6, border: "none",
                            background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0,
                          }}
                          onMouseEnter={e => { e.target.style.background = "var(--red-bg)"; e.target.style.color = "var(--red)"; }}
                          onMouseLeave={e => { e.target.style.background = "transparent"; e.target.style.color = "var(--text-muted)"; }}
                        >×</button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ═══ SECTION 3: Details ═══ */}
            <div style={{
              background: "var(--surface)", borderRadius: 14, border: "1px solid var(--border)",
              overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
                  Details
                </span>
                {detailETF && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    — viewing {detailETF.ticker}
                  </span>
                )}
                {!detailETF && etfPackage.length > 0 && (
                  <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    — package overview
                  </span>
                )}
              </div>

              {etfPackage.length === 0 && !detailETF ? (
                <div style={{ padding: "28px 16px", textAlign: "center" }}>
                  <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
                    Add ETFs to your package to see details and aggregate performance.
                  </p>
                </div>
              ) : detailETF ? (
                /* ── Individual ETF Detail View ── */
                <div style={{ padding: 20, animation: "slideUp 0.15s ease" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                        <span style={{ fontSize: 20, fontWeight: 800, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                          {detailETF.ticker}
                        </span>
                        <span style={{
                          fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                          background: "var(--accent-light)", color: "var(--accent)",
                        }}>{detailETF.asset_class}</span>
                        {detailETF.esg && <span style={{
                          fontSize: 10, fontWeight: 600, padding: "3px 10px", borderRadius: 10,
                          background: "var(--green-bg)", color: "var(--green)",
                        }}>ESG</span>}
                      </div>
                      <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)", fontFamily: "'DM Sans', sans-serif", margin: 0 }}>
                        {detailETF.name}
                      </h3>
                      <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                        {detailETF.provider} · {detailETF.sector} · {detailETF.industry} · {detailETF.geo}
                      </p>
                    </div>
                    <button onClick={() => setDetailETF(null)} style={{
                      background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                      padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)",
                      fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                    }}>Back to overview</button>
                  </div>

                  {/* Key Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Expense Ratio", value: detailETF.expense.toFixed(2) + "%" },
                      { label: "AUM", value: fmtAum(detailETF.aum) },
                      { label: "Div. Yield", value: detailETF.div_yield.toFixed(1) + "%" },
                      { label: "Risk Level", value: detailETF.risk },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        background: "var(--bg)", borderRadius: 8, padding: "10px 12px",
                        border: "1px solid var(--border)",
                      }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Performance Grid */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Performance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6, marginBottom: 16 }}>
                    {PERF_RANGES.map(r => {
                      const v = detailETF.perf[r];
                      return (
                        <div key={r} style={{
                          background: v >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                          borderRadius: 8, padding: "8px 6px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{r}</div>
                          <div style={{
                            fontSize: 12, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: v >= 0 ? "var(--green)" : "var(--red)",
                          }}>{fmt(v)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Tags */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {detailETF.tags.map(t => (
                      <span key={t} style={{
                        fontSize: 10, color: "var(--text-muted)", background: "var(--bg)",
                        border: "1px solid var(--border)", padding: "2px 9px", borderRadius: 10,
                      }}>#{t}</span>
                    ))}
                  </div>
                </div>
              ) : packageStats ? (
                /* ── Package Overview ── */
                <div style={{ padding: 20, animation: "slideUp 0.15s ease" }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                    Package summary — {etfPackage.length} ETF{etfPackage.length !== 1 ? "s" : ""}
                  </div>

                  {/* Aggregate Metrics */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
                    {[
                      { label: "Avg Expense", value: packageStats.avgExpense.toFixed(2) + "%" },
                      { label: "Combined AUM", value: fmtAum(packageStats.totalAum) },
                      { label: "Avg Div. Yield", value: packageStats.avgDivYield.toFixed(1) + "%" },
                      { label: "Sectors", value: packageStats.sectors.length },
                    ].map(({ label, value }) => (
                      <div key={label} style={{
                        background: "var(--bg)", borderRadius: 8, padding: "10px 12px",
                        border: "1px solid var(--border)",
                      }}>
                        <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Average Performance */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Average performance</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 6, marginBottom: 16 }}>
                    {PERF_RANGES.map(r => {
                      const v = packageStats.avgPerf[r];
                      return (
                        <div key={r} style={{
                          background: v >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                          borderRadius: 8, padding: "8px 6px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: 10, color: "var(--text-muted)", marginBottom: 3 }}>{r}</div>
                          <div style={{
                            fontSize: 12, fontWeight: 700,
                            fontFamily: "'JetBrains Mono', monospace",
                            color: v >= 0 ? "var(--green)" : "var(--red)",
                          }}>{fmt(v)}</div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Comparison Table */}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Fund comparison</div>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                      <thead>
                        <tr style={{ borderBottom: "2px solid var(--border)" }}>
                          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Fund</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Expense</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Yield</th>
                          <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>Risk</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>YTD</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>1Y</th>
                          <th style={{ padding: "8px 10px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>3Y</th>
                          <th style={{ padding: "8px 4px", width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {etfPackage.map(etf => (
                          <tr key={etf.ticker} className="etf-row"
                            style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                            onClick={() => setDetailETF(etf)}>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{etf.ticker}</span>
                              <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>{etf.sector}</span>
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                              {etf.expense.toFixed(2)}%
                            </td>
                            <td style={{ padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                              {etf.div_yield.toFixed(1)}%
                            </td>
                            <td style={{ padding: "9px 10px" }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
                                background: etf.risk === "Conservative" ? "var(--green-bg)" :
                                           etf.risk === "Aggressive" ? "var(--red-bg)" :
                                           etf.risk === "Moderate" ? "var(--accent-light)" : "var(--amber-bg)",
                                color: etf.risk === "Conservative" ? "var(--green)" :
                                       etf.risk === "Aggressive" ? "var(--red)" :
                                       etf.risk === "Moderate" ? "var(--accent)" : "var(--amber)",
                              }}>{etf.risk.replace("Moderately ", "M.")}</span>
                            </td>
                            <td style={{
                              padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600, color: etf.perf["YTD"] >= 0 ? "var(--green)" : "var(--red)",
                            }}>{fmt(etf.perf["YTD"])}</td>
                            <td style={{
                              padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600, color: etf.perf["1Y"] >= 0 ? "var(--green)" : "var(--red)",
                            }}>{fmt(etf.perf["1Y"])}</td>
                            <td style={{
                              padding: "9px 10px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                              fontWeight: 600, color: etf.perf["3Y"] >= 0 ? "var(--green)" : "var(--red)",
                            }}>{fmt(etf.perf["3Y"])}</td>
                            <td style={{ padding: "9px 4px", textAlign: "center" }}>
                              <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 500 }}>→</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Sector distribution */}
                  <div style={{ marginTop: 16, fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>Sector exposure</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {packageStats.sectors.map(s => {
                      const count = etfPackage.filter(e => e.sector === s).length;
                      return (
                        <span key={s} style={{
                          fontSize: 11, padding: "4px 12px", borderRadius: 12,
                          background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600,
                        }}>{s} ({count})</span>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </main>
        </div>

        {/* ─── Footer ─── */}
        <footer style={{
          background: "var(--surface)", borderTop: "1px solid var(--border)", padding: "16px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12,
        }}>
          <p style={{ fontSize: 12, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 700 }}>
            <strong style={{ color: "var(--text-secondary)" }}>Disclaimer:</strong> For informational and educational purposes only. 
            Not investment advice. Past performance does not guarantee future results. 
            Consult a qualified financial advisor before making investment decisions.
          </p>
          <button onClick={() => setShowDisclosure(true)} style={{
            background: "var(--accent-light)", border: "1px solid var(--accent)",
            borderRadius: 8, padding: "7px 18px", fontSize: 12, fontWeight: 600,
            color: "var(--accent)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
          }}>
            Full Disclosures →
          </button>
        </footer>
      </div>

      {showDisclosure && <DisclosureModal onClose={() => setShowDisclosure(false)} />}
    </>
  );
}
