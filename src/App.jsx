import React, { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { initTelemetry, trackEvent } from "./telemetry";

// ─── ETF Dataset (derived from publicly available market data) ───
const ETF_DATA = [
  { ticker: "SPY", name: "State Street SPDR S&P 500 ETF Trust", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 698270, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.2, "1M": -7.3, "3M": -7.9, "6M": -3.6, "YTD": -6.9, "1Y": 13.1, "2Y": 25.0, "3Y": 66.6}, tags: ["broad market", "large cap blend"] },
  { ticker: "VOO", name: "Vanguard S&P 500 ETF", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.03, aum: 1512902, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.6, "1M": -7.6, "3M": -8.2, "6M": -3.9, "YTD": -7.2, "1Y": 12.8, "2Y": 24.7, "3Y": 66.4}, tags: ["broad market", "large cap blend"] },
  { ticker: "VTI", name: "Vanguard Total Stock Market Index Fund ETF Shares", sector: "Broad Market", industry: "Total Market", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.03, aum: 2088925, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.4, "1M": -7.6, "3M": -7.8, "6M": -3.8, "YTD": -6.9, "1Y": 13.2, "2Y": 24.1, "3Y": 64.8}, tags: ["broad market", "total market"] },
  { ticker: "QQQ", name: "Invesco QQQ Trust", sector: "Technology", industry: "Large Cap Growth", asset_class: "Equity", geo: "US", provider: "Invesco", risk: "Moderately Aggressive", esg: false, expense: 0.2, aum: 395033, div_yield: 0.5, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.3, "1M": -7.4, "3M": -9.8, "6M": -5.5, "YTD": -8.2, "1Y": 17.2, "2Y": 27.7, "3Y": 86.2}, tags: ["growth", "technology", "large cap growth"] },
  { ticker: "IWM", name: "iShares Russell 2000 ETF", sector: "Broad Market", industry: "Small Cap Blend", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.19, aum: 73953, div_yield: 1.0, cap: "Small", style: "Blend", perf: {"1D": 0.0, "1W": -1.8, "1M": -6.8, "3M": -3.1, "6M": 1.2, "YTD": -2.1, "1Y": 20.1, "2Y": 20.9, "3Y": 45.3}, tags: ["broad market", "small cap blend"] },
  { ticker: "IWF", name: "iShares Russell 1000 Growth ETF", sector: "Broad Market", industry: "Large Cap Growth", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderately Aggressive", esg: false, expense: 0.19, aum: 116507, div_yield: 0.4, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.9, "1M": -8.2, "3M": -14.0, "6M": -11.0, "YTD": -12.4, "1Y": 12.0, "2Y": 23.3, "3Y": 78.3}, tags: ["growth", "broad market", "large cap growth"] },
  { ticker: "IWD", name: "iShares Russell 1000 Value ETF", sector: "Broad Market", industry: "Large Cap Value", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderate", esg: false, expense: 0.19, aum: 71033, div_yield: 1.6, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -1.4, "1M": -6.5, "3M": -0.8, "6M": 4.4, "YTD": -0.6, "1Y": 13.2, "2Y": 23.9, "3Y": 50.5}, tags: ["value", "broad market", "large cap value"] },
  { ticker: "VTV", name: "Vanguard Value Index Fund ETF Shares", sector: "Broad Market", industry: "Large Cap Value", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.04, aum: 238547, div_yield: 1.9, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -1.3, "1M": -6.7, "3M": 0.3, "6M": 4.7, "YTD": 0.3, "1Y": 13.6, "2Y": 25.5, "3Y": 53.4}, tags: ["value", "broad market", "large cap value"] },
  { ticker: "VUG", name: "Vanguard Growth Index Fund ETF Shares", sector: "Broad Market", industry: "Large Cap Growth", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.04, aum: 335907, div_yield: 0.4, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -5.4, "1M": -8.4, "3M": -14.7, "6M": -11.2, "YTD": -13.1, "1Y": 11.3, "2Y": 23.4, "3Y": 79.3}, tags: ["growth", "broad market", "large cap growth"] },
  { ticker: "VO", name: "Vanguard Mid-Cap Index Fund ETF Shares", sector: "Broad Market", industry: "Mid Cap Blend", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.04, aum: 210340, div_yield: 1.4, cap: "Mid", style: "Blend", perf: {"1D": 0.0, "1W": -2.0, "1M": -7.6, "3M": -4.0, "6M": -2.6, "YTD": -3.4, "1Y": 9.6, "2Y": 18.2, "3Y": 45.5}, tags: ["broad market", "mid cap blend"] },
  { ticker: "VB", name: "Vanguard Small-Cap Index Fund ETF Shares", sector: "Broad Market", industry: "Small Cap Blend", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Aggressive", esg: false, expense: 0.05, aum: 173791, div_yield: 1.2, cap: "Small", style: "Blend", perf: {"1D": 0.0, "1W": -2.3, "1M": -7.5, "3M": -2.5, "6M": 1.2, "YTD": -2.0, "1Y": 14.5, "2Y": 17.2, "3Y": 45.7}, tags: ["broad market", "small cap blend"] },
  { ticker: "MDY", name: "State Street SPDR S&P MIDCAP 400 ETF Trust", sector: "Broad Market", industry: "Mid Cap Blend", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.23, aum: 25646, div_yield: 1.1, cap: "Mid", style: "Blend", perf: {"1D": 0.0, "1W": -1.4, "1M": -7.3, "3M": -1.6, "6M": 1.8, "YTD": -1.0, "1Y": 12.7, "2Y": 13.4, "3Y": 41.2}, tags: ["broad market", "mid cap blend"] },
  { ticker: "IJR", name: "iShares Core S&P Small-Cap ETF", sector: "Broad Market", industry: "Small Cap Blend", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.06, aum: 95757, div_yield: 1.3, cap: "Small", style: "Blend", perf: {"1D": 0.0, "1W": -0.9, "1M": -6.0, "3M": -1.0, "6M": 3.4, "YTD": 0.5, "1Y": 16.1, "2Y": 17.1, "3Y": 35.4}, tags: ["broad market", "small cap blend"] },
  { ticker: "RSP", name: "Invesco S&P 500 Equal Weight ETF", sector: "Broad Market", industry: "Equal Weight", asset_class: "Equity", geo: "US", provider: "Invesco", risk: "Moderate", esg: false, expense: 0.2, aum: 90677, div_yield: 1.5, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -1.7, "1M": -8.1, "3M": -2.8, "6M": 0.3, "YTD": -2.3, "1Y": 9.4, "2Y": 16.6, "3Y": 41.1}, tags: ["broad market", "equal weight"] },
  { ticker: "SPLG", name: "State Street SPDR Portfolio S&P 500 ETF", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.02, aum: 97328, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.2, "1M": -7.3, "3M": -7.9, "6M": -3.0, "YTD": -6.9, "1Y": 12.9, "2Y": 24.8, "3Y": 66.9}, tags: ["broad market", "large cap blend"] },
  { ticker: "SCHX", name: "Schwab U.S. Large-Cap ETF", sector: "Broad Market", industry: "Large Cap Blend", asset_class: "Equity", geo: "US", provider: "Schwab", risk: "Moderate", esg: false, expense: 0.03, aum: 64140, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.4, "1M": -7.6, "3M": -8.2, "6M": -4.2, "YTD": -7.3, "1Y": 12.7, "2Y": 24.2, "3Y": 66.5}, tags: ["broad market", "large cap blend"] },
  { ticker: "SCHA", name: "Schwab U.S. Small-Cap ETF", sector: "Broad Market", industry: "Small Cap Blend", asset_class: "Equity", geo: "US", provider: "Schwab", risk: "Aggressive", esg: false, expense: 0.04, aum: 20749, div_yield: 1.2, cap: "Small", style: "Blend", perf: {"1D": 0.0, "1W": -2.0, "1M": -6.7, "3M": -2.2, "6M": 2.6, "YTD": -1.2, "1Y": 19.9, "2Y": 21.4, "3Y": 46.2}, tags: ["broad market", "small cap blend"] },
  { ticker: "SCHB", name: "Schwab U.S. Broad Market ETF", sector: "Broad Market", industry: "Total Market", asset_class: "Equity", geo: "US", provider: "Schwab", risk: "Moderate", esg: false, expense: 0.03, aum: 38703, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.4, "1M": -7.5, "3M": -7.8, "6M": -3.8, "YTD": -6.9, "1Y": 13.1, "2Y": 24.0, "3Y": 64.9}, tags: ["broad market", "total market"] },
  { ticker: "XLK", name: "State Street Technology Select Sector SPDR ETF", sector: "Technology", industry: "Information Technology", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 87686, div_yield: 0.6, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -5.1, "1M": -6.4, "3M": -11.3, "6M": -6.7, "YTD": -10.0, "1Y": 23.4, "2Y": 26.0, "3Y": 83.8}, tags: ["technology", "information technology"] },
  { ticker: "VGT", name: "Vanguard Information Technology Index Fund ETF Shares", sector: "Technology", industry: "Information Technology", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.1, aum: 126509, div_yield: 0.4, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.9, "1M": -6.3, "3M": -11.2, "6M": -7.7, "YTD": -9.9, "1Y": 22.6, "2Y": 30.5, "3Y": 88.1}, tags: ["technology", "information technology"] },
  { ticker: "SOXX", name: "iShares Semiconductor ETF", sector: "Technology", industry: "Semiconductors", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.35, aum: 21675, div_yield: 0.5, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -3.9, "1M": -8.1, "3M": 5.8, "6M": 20.6, "YTD": 3.2, "1Y": 67.3, "2Y": 45.9, "3Y": 135.2}, tags: ["technology", "semiconductors"] },
  { ticker: "SMH", name: "VanEck Semiconductor ETF", sector: "Technology", industry: "Semiconductors", asset_class: "Equity", geo: "US", provider: "VanEck", risk: "Aggressive", esg: false, expense: 0.35, aum: 46250, div_yield: 0.3, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.4, "1M": -7.9, "3M": 2.3, "6M": 16.7, "YTD": 0.3, "1Y": 72.4, "2Y": 66.1, "3Y": 203.6}, tags: ["technology", "semiconductors"] },
  { ticker: "ARKK", name: "ARK Innovation ETF", sector: "Technology", industry: "Disruptive Innovation", asset_class: "Equity", geo: "US", provider: "ARK Invest", risk: "Aggressive", esg: false, expense: 0.75, aum: 6516, div_yield: 0.0, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -8.9, "1M": -11.4, "3M": -18.9, "6M": -22.2, "YTD": -17.5, "1Y": 27.3, "2Y": 28.6, "3Y": 75.2}, tags: ["technology", "disruptive innovation"] },
  { ticker: "HACK", name: "Amplify Cybersecurity ETF", sector: "Technology", industry: "Cybersecurity", asset_class: "Equity", geo: "US", provider: "Amplify", risk: "Moderately Aggressive", esg: false, expense: 0.6, aum: 1845, div_yield: 0.1, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -7.0, "1M": -0.7, "3M": -11.3, "6M": -16.2, "YTD": -8.4, "1Y": -1.5, "2Y": 14.0, "3Y": 58.2}, tags: ["cybersecurity", "technology"] },
  { ticker: "BOTZ", name: "Global X Robotics & Artificial Intelligence ETF", sector: "Technology", industry: "Robotics & AI", asset_class: "Equity", geo: "Global", provider: "Global X", risk: "Aggressive", esg: false, expense: 0.68, aum: 3537, div_yield: 0.6, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -5.2, "1M": -16.8, "3M": -10.9, "6M": -6.5, "YTD": -11.6, "1Y": 9.4, "2Y": 2.5, "3Y": 34.6}, tags: ["technology", "global", "robotics & ai"] },
  { ticker: "IGV", name: "iShares Expanded Tech-Software Sector ETF", sector: "Technology", industry: "Software", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderately Aggressive", esg: false, expense: 0.4, aum: 9197, div_yield: 0.0, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -8.9, "1M": -5.7, "3M": -28.9, "6M": -33.1, "YTD": -25.1, "1Y": -16.9, "2Y": -10.3, "3Y": 32.5}, tags: ["software", "technology"] },
  { ticker: "SKYY", name: "First Trust Cloud Computing ETF", sector: "Technology", industry: "Cloud Computing", asset_class: "Equity", geo: "US", provider: "First Trust", risk: "Aggressive", esg: false, expense: 0.6, aum: 2408, div_yield: 0.0, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -6.9, "1M": -3.3, "3M": -19.9, "6M": -21.2, "YTD": -17.0, "1Y": -0.6, "2Y": 10.6, "3Y": 67.5}, tags: ["technology", "cloud computing"] },
  { ticker: "WCLD", name: "WisdomTree Cloud Computing Fund", sector: "Technology", industry: "Cloud Computing", asset_class: "Equity", geo: "US", provider: "WisdomTree", risk: "Aggressive", esg: false, expense: 0.45, aum: 224, div_yield: 0.0, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -8.1, "1M": -4.0, "3M": -26.5, "6M": -27.1, "YTD": -22.6, "1Y": -22.8, "2Y": -24.2, "3Y": -5.3}, tags: ["technology", "cloud computing"] },
  { ticker: "XLV", name: "State Street Health Care Select Sector SPDR ETF", sector: "Healthcare", industry: "Diversified Healthcare", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 43115, div_yield: 1.6, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -1.0, "1M": -10.6, "3M": -8.2, "6M": 6.2, "YTD": -7.9, "1Y": 0.2, "2Y": 1.6, "3Y": 18.1}, tags: ["healthcare", "diversified healthcare"] },
  { ticker: "VHT", name: "Vanguard Health Care Index Fund ETF Shares", sector: "Healthcare", industry: "Diversified Healthcare", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.1, aum: 20252, div_yield: 1.6, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -1.5, "1M": -10.2, "3M": -8.7, "6M": 5.4, "YTD": -8.1, "1Y": 1.9, "2Y": 2.8, "3Y": 18.5}, tags: ["healthcare", "diversified healthcare"] },
  { ticker: "IBB", name: "iShares Biotechnology ETF", sector: "Healthcare", industry: "Biotechnology", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.44, aum: 8784, div_yield: 0.2, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -1.4, "1M": -8.5, "3M": -6.7, "6M": 14.0, "YTD": -5.0, "1Y": 22.2, "2Y": 18.5, "3Y": 28.3}, tags: ["healthcare", "biotechnology"] },
  { ticker: "XBI", name: "State Street SPDR S&P Biotech ETF", sector: "Healthcare", industry: "Biotechnology", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Aggressive", esg: false, expense: 0.35, aum: 8056, div_yield: 0.3, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -1.7, "1M": -6.1, "3M": -4.3, "6M": 22.5, "YTD": -1.6, "1Y": 40.3, "2Y": 29.7, "3Y": 61.5}, tags: ["healthcare", "biotechnology"] },
  { ticker: "ARKG", name: "ARK Genomic Revolution ETF", sector: "Healthcare", industry: "Genomics", asset_class: "Equity", geo: "US", provider: "ARK Invest", risk: "Aggressive", esg: false, expense: 0.75, aum: 1296, div_yield: 0.0, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -6.1, "1M": -16.6, "3M": -15.7, "6M": -7.1, "YTD": -14.3, "1Y": 12.5, "2Y": -11.2, "3Y": -10.7}, tags: ["healthcare", "genomics"] },
  { ticker: "XLF", name: "State Street Financial Select Sector SPDR ETF", sector: "Financials", industry: "Diversified Financials", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 49680, div_yield: 1.4, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -3.0, "1M": -7.0, "3M": -14.0, "6M": -10.9, "YTD": -13.0, "1Y": -3.7, "2Y": 18.9, "3Y": 58.9}, tags: ["diversified financials", "financials"] },
  { ticker: "VFH", name: "Vanguard Financials Index Fund ETF Shares", sector: "Financials", industry: "Diversified Financials", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.1, aum: 13887, div_yield: 1.7, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -3.1, "1M": -6.8, "3M": -13.8, "6M": -10.6, "YTD": -12.7, "1Y": -1.7, "2Y": 20.1, "3Y": 62.0}, tags: ["diversified financials", "financials"] },
  { ticker: "KBE", name: "State Street SPDR S&P Bank ETF", sector: "Financials", industry: "Banking", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.35, aum: 1350, div_yield: 2.5, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": -1.0, "1M": -5.2, "3M": -7.0, "6M": -3.5, "YTD": -5.4, "1Y": 10.1, "2Y": 33.2, "3Y": 70.6}, tags: ["banking", "financials"] },
  { ticker: "KRE", name: "State Street SPDR S&P Regional Banking ETF", sector: "Financials", industry: "Regional Banking", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.35, aum: 3919, div_yield: 2.4, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": -0.7, "1M": -5.1, "3M": -4.7, "6M": -0.7, "YTD": -2.9, "1Y": 12.3, "2Y": 36.9, "3Y": 56.8}, tags: ["regional banking", "financials"] },
  { ticker: "XLE", name: "State Street Energy Select Sector SPDR ETF", sector: "Energy", industry: "Oil & Gas", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 37876, div_yield: 2.6, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 4.9, "1M": 11.9, "3M": 41.5, "6M": 37.2, "YTD": 37.0, "1Y": 38.1, "2Y": 42.1, "3Y": 69.7}, tags: ["energy", "oil & gas"] },
  { ticker: "VDE", name: "Vanguard Energy Index Fund ETF Shares", sector: "Energy", industry: "Diversified Energy", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.1, aum: 11325, div_yield: 2.5, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 4.4, "1M": 12.3, "3M": 42.1, "6M": 37.6, "YTD": 37.5, "1Y": 40.5, "2Y": 43.9, "3Y": 73.0}, tags: ["diversified energy", "energy"] },
  { ticker: "XOP", name: "State Street SPDR S&P Oil & Gas Exploration & Production ETF", sector: "Energy", industry: "Oil & Gas Exploration", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.35, aum: 2690, div_yield: 2.1, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": 7.6, "1M": 22.4, "3M": 50.6, "6M": 38.1, "YTD": 45.9, "1Y": 45.6, "2Y": 29.1, "3Y": 61.6}, tags: ["oil & gas exploration", "energy"] },
  { ticker: "OIH", name: "VanEck Oil Services ETF", sector: "Energy", industry: "Oil Services", asset_class: "Equity", geo: "US", provider: "VanEck", risk: "Moderately Aggressive", esg: false, expense: 0.35, aum: 2578, div_yield: 1.2, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": 4.4, "1M": 4.8, "3M": 47.8, "6M": 58.0, "YTD": 40.6, "1Y": 59.9, "2Y": 29.3, "3Y": 59.3}, tags: ["oil services", "energy"] },
  { ticker: "ICLN", name: "iShares Global Clean Energy ETF", sector: "Energy", industry: "Clean Energy", asset_class: "Equity", geo: "Global", provider: "iShares", risk: "Aggressive", esg: true, expense: 0.4, aum: 2122, div_yield: 1.5, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -1.8, "1M": -2.0, "3M": 7.4, "6M": 18.3, "YTD": 4.4, "1Y": 57.7, "2Y": 36.2, "3Y": -0.2}, tags: ["clean energy", "energy", "sustainable", "global", "esg"] },
  { ticker: "TAN", name: "Invesco Solar ETF", sector: "Energy", industry: "Solar", asset_class: "Equity", geo: "US", provider: "Invesco", risk: "Aggressive", esg: true, expense: 0.5, aum: 1571, div_yield: 0.0, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -0.9, "1M": -0.9, "3M": 7.3, "6M": 25.6, "YTD": 5.7, "1Y": 74.4, "2Y": 26.1, "3Y": -24.4}, tags: ["sustainable", "esg", "energy", "solar"] },
  { ticker: "QCLN", name: "First Trust NASDAQ Clean Edge Green Energy Index Fund", sector: "Energy", industry: "Clean Energy", asset_class: "Equity", geo: "US", provider: "First Trust", risk: "Aggressive", esg: true, expense: 0.58, aum: 576, div_yield: 0.2, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -2.2, "1M": -5.9, "3M": -1.8, "6M": 8.6, "YTD": -2.0, "1Y": 53.7, "2Y": 38.6, "3Y": -5.0}, tags: ["sustainable", "clean energy", "esg", "energy"] },
  { ticker: "XLY", name: "State Street Consumer Discretionary Select Sector SPDR ETF", sector: "Consumer Discretionary", industry: "Retail & Consumer", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 22738, div_yield: 0.8, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.0, "1M": -9.6, "3M": -13.4, "6M": -11.7, "YTD": -10.7, "1Y": 4.5, "2Y": 17.8, "3Y": 52.5}, tags: ["retail & consumer", "consumer discretionary"] },
  { ticker: "XLP", name: "State Street Consumer Staples Select Sector SPDR ETF", sector: "Consumer Staples", industry: "Consumer Products", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Conservative", esg: false, expense: 0.09, aum: 17557, div_yield: 2.4, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 0.7, "1M": -9.1, "3M": 4.5, "6M": 5.7, "YTD": 5.3, "1Y": 3.4, "2Y": 13.7, "3Y": 20.1}, tags: ["consumer products", "consumer staples"] },
  { ticker: "VCR", name: "Vanguard Consumer Discretionary Index Fund ETF Shares", sector: "Consumer Discretionary", industry: "Diversified Consumer", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.1, aum: 6681, div_yield: 0.8, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -4.2, "1M": -9.4, "3M": -13.5, "6M": -12.2, "YTD": -11.1, "1Y": 4.1, "2Y": 12.4, "3Y": 48.3}, tags: ["consumer discretionary", "diversified consumer"] },
  { ticker: "VDC", name: "Vanguard Consumer Staples Index Fund ETF Shares", sector: "Consumer Staples", industry: "Diversified Staples", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.1, aum: 9866, div_yield: 1.9, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 0.3, "1M": -8.6, "3M": 4.8, "6M": 5.5, "YTD": 5.8, "1Y": 4.7, "2Y": 15.3, "3Y": 25.4}, tags: ["consumer staples", "diversified staples"] },
  { ticker: "XLI", name: "State Street Industrial Select Sector SPDR ETF", sector: "Industrials", industry: "Diversified Industrials", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 31647, div_yield: 1.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.4, "1M": -10.1, "3M": 1.3, "6M": 4.7, "YTD": 0.8, "1Y": 21.1, "2Y": 31.3, "3Y": 69.0}, tags: ["industrials", "diversified industrials"] },
  { ticker: "VIS", name: "Vanguard Industrials Index Fund ETF Shares", sector: "Industrials", industry: "Diversified Industrials", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.1, aum: 8128, div_yield: 0.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.6, "1M": -10.1, "3M": 1.2, "6M": 5.2, "YTD": 0.9, "1Y": 23.0, "2Y": 30.4, "3Y": 72.0}, tags: ["industrials", "diversified industrials"] },
  { ticker: "XLB", name: "State Street Materials Select Sector SPDR ETF", sector: "Materials", industry: "Chemicals & Mining", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Aggressive", esg: false, expense: 0.09, aum: 7246, div_yield: 1.6, cap: "Mid", style: "Blend", perf: {"1D": 0.0, "1W": 2.9, "1M": -8.4, "3M": 6.1, "6M": 10.7, "YTD": 6.0, "1Y": 14.6, "2Y": 10.7, "3Y": 32.8}, tags: ["chemicals & mining", "materials"] },
  { ticker: "VAW", name: "Vanguard Materials Index Fund ETF Shares", sector: "Materials", industry: "Diversified Materials", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Aggressive", esg: false, expense: 0.1, aum: 4733, div_yield: 1.3, cap: "Mid", style: "Blend", perf: {"1D": 0.0, "1W": 2.1, "1M": -10.0, "3M": 3.8, "6M": 8.9, "YTD": 4.2, "1Y": 16.4, "2Y": 12.7, "3Y": 33.9}, tags: ["diversified materials", "materials"] },
  { ticker: "XLU", name: "State Street Utilities Select Sector SPDR ETF", sector: "Utilities", industry: "Electric Utilities", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Conservative", esg: false, expense: 0.09, aum: 24357, div_yield: 2.4, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 1.8, "1M": -4.5, "3M": 6.6, "6M": 5.8, "YTD": 5.6, "1Y": 20.3, "2Y": 49.6, "3Y": 50.5}, tags: ["electric utilities", "utilities"] },
  { ticker: "VPU", name: "Vanguard Utilities Index Fund ETF Shares", sector: "Utilities", industry: "Diversified Utilities", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.1, aum: 11029, div_yield: 2.5, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 1.1, "1M": -4.4, "3M": 6.1, "6M": 5.4, "YTD": 5.2, "1Y": 19.8, "2Y": 48.7, "3Y": 49.3}, tags: ["utilities", "diversified utilities"] },
  { ticker: "XLRE", name: "State Street Real Estate Select Sector SPDR ETF", sector: "Real Estate", industry: "REITs", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderately Conservative", esg: false, expense: 0.09, aum: 7706, div_yield: 3.2, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": -1.5, "1M": -8.7, "3M": -1.3, "6M": -3.4, "YTD": -0.9, "1Y": -0.7, "2Y": 10.6, "3Y": 24.9}, tags: ["dividends", "real estate", "reits"] },
  { ticker: "VNQ", name: "Vanguard Real Estate Index Fund ETF Shares", sector: "Real Estate", industry: "REITs", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.12, aum: 69606, div_yield: 3.6, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": -2.7, "1M": -9.1, "3M": -2.1, "6M": -3.5, "YTD": -1.7, "1Y": -0.4, "2Y": 10.9, "3Y": 23.8}, tags: ["dividends", "real estate", "reits"] },
  { ticker: "VNQI", name: "Vanguard Global ex-U.S. Real Estate Index Fund ETF Shares", sector: "Real Estate", industry: "International REITs", asset_class: "Equity", geo: "Global", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.12, aum: 4241, div_yield: 4.2, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": -3.0, "1M": -14.7, "3M": -6.2, "6M": -4.2, "YTD": -6.0, "1Y": 10.7, "2Y": 14.2, "3Y": 24.4}, tags: ["dividends", "global", "real estate", "international reits"] },
  { ticker: "XLC", name: "State Street Communication Services Select Sector SPDR ETF", sector: "Communication Services", industry: "Media & Telecom", asset_class: "Equity", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.09, aum: 27164, div_yield: 1.1, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -5.0, "1M": -9.3, "3M": -9.3, "6M": -9.1, "YTD": -8.4, "1Y": 9.5, "2Y": 34.0, "3Y": 97.3}, tags: ["media & telecom", "communication services"] },
  { ticker: "VOX", name: "Vanguard Communication Services Index Fund ETF Shares", sector: "Communication Services", industry: "Diversified Telecom", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.1, aum: 6323, div_yield: 1.0, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -6.3, "1M": -10.1, "3M": -10.9, "6M": -8.0, "YTD": -10.5, "1Y": 14.0, "2Y": 34.4, "3Y": 91.3}, tags: ["diversified telecom", "communication services"] },
  { ticker: "BND", name: "Vanguard Total Bond Market Index Fund", sector: "Fixed Income", industry: "Investment Grade Bonds", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.03, aum: 395346, div_yield: 3.8, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.5, "1M": -2.4, "3M": -0.8, "6M": 0.4, "YTD": -0.6, "1Y": 4.3, "2Y": 8.9, "3Y": 11.2}, tags: ["bonds", "dividends", "investment grade bonds", "fixed income"] },
  { ticker: "AGG", name: "iShares Core U.S. Aggregate Bond ETF", sector: "Fixed Income", industry: "Investment Grade Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.03, aum: 141223, div_yield: 3.8, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.5, "1M": -2.5, "3M": -0.9, "6M": 0.4, "YTD": -0.7, "1Y": 4.4, "2Y": 9.0, "3Y": 11.1}, tags: ["bonds", "dividends", "investment grade bonds", "fixed income"] },
  { ticker: "TLT", name: "iShares 20+ Year Treasury Bond ETF", sector: "Fixed Income", industry: "Long-Term Treasury", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.15, aum: 45429, div_yield: 4.3, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.9, "1M": -5.4, "3M": -1.7, "6M": -1.6, "YTD": -0.9, "1Y": 0.7, "2Y": -0.3, "3Y": -7.6}, tags: ["dividends", "bonds", "long-term treasury", "fixed income"] },
  { ticker: "IEF", name: "iShares 7-10 Year Treasury Bond ETF", sector: "Fixed Income", industry: "Intermediate Treasury", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.15, aum: 48743, div_yield: 3.7, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.6, "1M": -3.2, "3M": -1.3, "6M": 0.2, "YTD": -0.9, "1Y": 4.2, "2Y": 8.1, "3Y": 6.5}, tags: ["intermediate treasury", "bonds", "dividends", "fixed income"] },
  { ticker: "SHY", name: "iShares 1-3 Year Treasury Bond ETF", sector: "Fixed Income", industry: "Short-Term Treasury", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.15, aum: 24915, div_yield: 3.8, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.0, "1M": -0.7, "3M": 0.1, "6M": 1.2, "YTD": 0.0, "1Y": 3.7, "2Y": 8.9, "3Y": 12.0}, tags: ["short-term treasury", "dividends", "bonds", "fixed income"] },
  { ticker: "TIP", name: "iShares TIPS Bond ETF", sector: "Fixed Income", industry: "Inflation Protected", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.19, aum: 14353, div_yield: 3.4, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.5, "1M": -2.0, "3M": -0.3, "6M": -0.2, "YTD": -0.2, "1Y": 3.1, "2Y": 8.8, "3Y": 9.4}, tags: ["inflation protected", "dividends", "fixed income"] },
  { ticker: "LQD", name: "iShares iBoxx $ Investment Grade Corporate Bond ETF", sector: "Fixed Income", industry: "Corporate Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.14, aum: 31986, div_yield: 4.4, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.9, "1M": -3.3, "3M": -2.0, "6M": -1.1, "YTD": -1.6, "1Y": 4.4, "2Y": 8.6, "3Y": 13.6}, tags: ["corporate bonds", "dividends", "bonds", "fixed income"] },
  { ticker: "HYG", name: "iShares iBoxx $ High Yield Corporate Bond ETF", sector: "Fixed Income", industry: "High Yield Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Moderate", esg: false, expense: 0.49, aum: 16745, div_yield: 5.8, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.9, "1M": -2.0, "3M": -1.4, "6M": -0.1, "YTD": -1.5, "1Y": 5.7, "2Y": 14.1, "3Y": 28.0}, tags: ["high yield bonds", "dividends", "bonds", "fixed income"] },
  { ticker: "JNK", name: "State Street SPDR Bloomberg High Yield Bond ETF", sector: "Fixed Income", industry: "High Yield Bonds", asset_class: "Fixed Income", geo: "US", provider: "State Street", risk: "Moderate", esg: false, expense: 0.4, aum: 7784, div_yield: 6.6, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.9, "1M": -2.1, "3M": -1.5, "6M": -0.1, "YTD": -1.6, "1Y": 6.0, "2Y": 13.7, "3Y": 28.2}, tags: ["high yield bonds", "dividends", "bonds", "fixed income"] },
  { ticker: "VCSH", name: "Vanguard Short-Term Corporate Bond Index Fund ETF Shares", sector: "Fixed Income", industry: "Short-Term Corporate", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.04, aum: 48298, div_yield: 4.3, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.3, "1M": -1.3, "3M": -0.3, "6M": 1.0, "YTD": -0.4, "1Y": 4.7, "2Y": 11.1, "3Y": 17.1}, tags: ["dividends", "short-term corporate", "fixed income"] },
  { ticker: "VCIT", name: "Vanguard Intermediate-Term Corporate Bond Index Fund ETF Shares", sector: "Fixed Income", industry: "Intermediate Corporate", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.04, aum: 68528, div_yield: 4.6, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.8, "1M": -3.0, "3M": -1.7, "6M": -0.1, "YTD": -1.4, "1Y": 5.7, "2Y": 11.9, "3Y": 17.6}, tags: ["dividends", "intermediate corporate", "fixed income"] },
  { ticker: "VCLT", name: "Vanguard Long-Term Corporate Bond Index Fund ETF Shares", sector: "Fixed Income", industry: "Long-Term Corporate", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.04, aum: 8665, div_yield: 5.4, cap: null, style: null, perf: {"1D": 0.0, "1W": -1.2, "1M": -4.6, "3M": -3.0, "6M": -2.5, "YTD": -2.2, "1Y": 3.5, "2Y": 5.4, "3Y": 9.9}, tags: ["long-term corporate", "dividends", "fixed income"] },
  { ticker: "BIV", name: "Vanguard Intermediate-Term Bond Index Fund", sector: "Fixed Income", industry: "Intermediate Bonds", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.04, aum: 52723, div_yield: 4.0, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.6, "1M": -2.9, "3M": -1.3, "6M": 0.2, "YTD": -1.0, "1Y": 4.9, "2Y": 10.1, "3Y": 12.3}, tags: ["intermediate bonds", "dividends", "bonds", "fixed income"] },
  { ticker: "BSV", name: "Vanguard Short-Term Bond Index Fund ETF Shares", sector: "Fixed Income", industry: "Short-Term Bonds", asset_class: "Fixed Income", geo: "US", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.04, aum: 69992, div_yield: 3.8, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.2, "1M": -1.1, "3M": -0.2, "6M": 1.1, "YTD": -0.2, "1Y": 4.1, "2Y": 9.8, "3Y": 13.3}, tags: ["short-term bonds", "bonds", "dividends", "fixed income"] },
  { ticker: "MUB", name: "iShares National Muni Bond ETF", sector: "Fixed Income", industry: "Municipal Bonds", asset_class: "Fixed Income", geo: "US", provider: "iShares", risk: "Conservative", esg: false, expense: 0.05, aum: 43211, div_yield: 3.1, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.7, "1M": -2.8, "3M": -0.6, "6M": 1.0, "YTD": -1.0, "1Y": 4.2, "2Y": 4.5, "3Y": 7.8}, tags: ["municipal bonds", "dividends", "bonds", "fixed income"] },
  { ticker: "EMB", name: "iShares J.P. Morgan USD Emerging Markets Bond ETF", sector: "Fixed Income", industry: "Emerging Market Bonds", asset_class: "Fixed Income", geo: "Emerging Markets", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.39, aum: 16458, div_yield: 4.9, cap: null, style: null, perf: {"1D": 0.0, "1W": -1.2, "1M": -4.5, "3M": -2.9, "6M": 0.0, "YTD": -2.7, "1Y": 8.3, "2Y": 15.1, "3Y": 28.2}, tags: ["emerging markets", "dividends", "emerging market bonds", "bonds", "fixed income"] },
  { ticker: "BNDX", name: "Vanguard Total International Bond Index Fund", sector: "Fixed Income", industry: "International Bonds", asset_class: "Fixed Income", geo: "Global", provider: "Vanguard", risk: "Conservative", esg: false, expense: 0.07, aum: 118795, div_yield: 4.3, cap: null, style: null, perf: {"1D": 0.0, "1W": -0.7, "1M": -2.9, "3M": -1.1, "6M": -0.5, "YTD": -0.9, "1Y": 2.3, "2Y": 5.9, "3Y": 11.2}, tags: ["international bonds", "global", "dividends", "bonds", "fixed income"] },
  { ticker: "VEA", name: "Vanguard FTSE Developed Markets Index Fund ETF Shares", sector: "Broad Market", industry: "International Developed", asset_class: "Equity", geo: "International Developed", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.05, aum: 307324, div_yield: 2.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.5, "1M": -11.5, "3M": -1.0, "6M": 6.4, "YTD": -1.7, "1Y": 23.5, "2Y": 32.5, "3Y": 55.8}, tags: ["international developed", "broad market"] },
  { ticker: "VWO", name: "Vanguard Emerging Markets Stock Index Fund", sector: "Broad Market", industry: "Emerging Markets", asset_class: "Equity", geo: "Emerging Markets", provider: "Vanguard", risk: "Aggressive", esg: false, expense: 0.08, aum: 158399, div_yield: 2.6, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.4, "1M": -9.7, "3M": -2.8, "6M": -0.1, "YTD": -4.4, "1Y": 17.1, "2Y": 33.8, "3Y": 44.3}, tags: ["emerging markets", "broad market"] },
  { ticker: "EFA", name: "iShares MSCI EAFE ETF", sector: "Broad Market", industry: "International Developed", asset_class: "Equity", geo: "International Developed", provider: "iShares", risk: "Moderate", esg: false, expense: 0.32, aum: 77837, div_yield: 3.1, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.1, "1M": -11.0, "3M": -2.9, "6M": 3.1, "YTD": -3.3, "1Y": 16.8, "2Y": 26.1, "3Y": 48.7}, tags: ["international developed", "broad market", "dividends"] },
  { ticker: "EEM", name: "iShares MSCI Emerging Markets ETF", sector: "Broad Market", industry: "Emerging Markets", asset_class: "Equity", geo: "Emerging Markets", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.68, aum: 30140, div_yield: 1.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.7, "1M": -11.8, "3M": 0.7, "6M": 6.2, "YTD": -1.8, "1Y": 26.8, "2Y": 41.6, "3Y": 52.4}, tags: ["emerging markets", "broad market"] },
  { ticker: "VXUS", name: "Vanguard Total International Stock Index Fund ETF Shares", sector: "Broad Market", industry: "Total International", asset_class: "Equity", geo: "Global", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.07, aum: 636672, div_yield: 2.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.5, "1M": -10.8, "3M": -1.4, "6M": 4.7, "YTD": -2.3, "1Y": 21.8, "2Y": 32.7, "3Y": 52.9}, tags: ["broad market", "global", "total international"] },
  { ticker: "IXUS", name: "iShares Core MSCI Total International Stock ETF", sector: "Broad Market", industry: "Total International", asset_class: "Equity", geo: "Global", provider: "iShares", risk: "Moderate", esg: false, expense: 0.07, aum: 57612, div_yield: 2.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.5, "1M": -10.9, "3M": -1.7, "6M": 4.3, "YTD": -2.4, "1Y": 21.8, "2Y": 32.6, "3Y": 52.8}, tags: ["broad market", "global", "total international"] },
  { ticker: "IEFA", name: "iShares Core MSCI EAFE ETF", sector: "Broad Market", industry: "International Developed", asset_class: "Equity", geo: "International Developed", provider: "iShares", risk: "Moderate", esg: false, expense: 0.07, aum: 182588, div_yield: 3.2, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.2, "1M": -11.0, "3M": -2.7, "6M": 3.0, "YTD": -3.2, "1Y": 17.7, "2Y": 27.1, "3Y": 49.2}, tags: ["international developed", "broad market", "dividends"] },
  { ticker: "IEMG", name: "iShares Core MSCI Emerging Markets ETF", sector: "Broad Market", industry: "Emerging Markets", asset_class: "Equity", geo: "Emerging Markets", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.09, aum: 148632, div_yield: 2.4, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.7, "1M": -11.6, "3M": 0.7, "6M": 5.9, "YTD": -1.7, "1Y": 26.9, "2Y": 40.3, "3Y": 54.0}, tags: ["emerging markets", "broad market"] },
  { ticker: "VGK", name: "Vanguard FTSE Europe ETF", sector: "Broad Market", industry: "Europe", asset_class: "Equity", geo: "International Developed", provider: "Vanguard", risk: "Moderate", esg: false, expense: 0.08, aum: 40994, div_yield: 2.6, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.0, "1M": -11.5, "3M": -4.9, "6M": 2.0, "YTD": -5.6, "1Y": 15.0, "2Y": 26.5, "3Y": 48.8}, tags: ["international developed", "broad market", "europe"] },
  { ticker: "EWJ", name: "iShares MSCI Japan ETF", sector: "Broad Market", industry: "Japan", asset_class: "Equity", geo: "International Developed", provider: "iShares", risk: "Moderate", esg: false, expense: 0.5, aum: 20312, div_yield: 4.0, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.5, "1M": -11.8, "3M": 0.6, "6M": 5.0, "YTD": 0.1, "1Y": 20.5, "2Y": 22.7, "3Y": 54.7}, tags: ["international developed", "broad market", "dividends", "japan"] },
  { ticker: "EWZ", name: "iShares MSCI Brazil ETF", sector: "Broad Market", industry: "Brazil", asset_class: "Equity", geo: "Emerging Markets", provider: "iShares", risk: "Moderately Aggressive", esg: false, expense: 0.58, aum: 9655, div_yield: 4.3, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -0.6, "1M": -5.4, "3M": 15.8, "6M": 23.4, "YTD": 13.8, "1Y": 46.7, "2Y": 29.4, "3Y": 66.0}, tags: ["emerging markets", "broad market", "dividends", "brazil"] },
  { ticker: "FXI", name: "iShares China Large-Cap ETF", sector: "Broad Market", industry: "China Large Cap", asset_class: "Equity", geo: "Emerging Markets", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.74, aum: 6212, div_yield: 2.5, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -1.5, "1M": -6.5, "3M": -10.5, "6M": -12.6, "YTD": -12.5, "1Y": -2.6, "2Y": 53.4, "3Y": 27.6}, tags: ["china large cap", "emerging markets", "broad market"] },
  { ticker: "KWEB", name: "KraneShares CSI China Internet ETF", sector: "Technology", industry: "China Internet", asset_class: "Equity", geo: "Emerging Markets", provider: "KraneShares", risk: "Aggressive", esg: false, expense: 0.69, aum: 6909, div_yield: 6.7, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -1.9, "1M": -10.1, "3M": -19.9, "6M": -27.9, "YTD": -21.7, "1Y": -18.1, "2Y": 17.4, "3Y": 0.7}, tags: ["technology", "dividends", "china internet", "emerging markets"] },
  { ticker: "INDA", name: "iShares MSCI India ETF", sector: "Broad Market", industry: "India", asset_class: "Equity", geo: "Emerging Markets", provider: "iShares", risk: "Moderately Aggressive", esg: false, expense: 0.64, aum: 9252, div_yield: 0.0, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -3.8, "1M": -12.3, "3M": -14.9, "6M": -12.3, "YTD": -16.0, "1Y": -11.5, "2Y": -8.7, "3Y": 20.4}, tags: ["india", "emerging markets", "broad market"] },
  { ticker: "GLD", name: "SPDR Gold Shares", sector: "Commodities", industry: "Precious Metals", asset_class: "Commodity", geo: "Global", provider: "State Street", risk: "Moderate", esg: false, expense: 0.4, aum: 184864, div_yield: 0.0, cap: null, style: null, perf: {"1D": 0.0, "1W": 2.6, "1M": -14.3, "3M": -0.5, "6M": 19.6, "YTD": 4.1, "1Y": 47.1, "2Y": 106.3, "3Y": 126.1}, tags: ["commodity", "global", "precious metals", "commodities"] },
  { ticker: "SLV", name: "iShares Silver Trust", sector: "Commodities", industry: "Precious Metals", asset_class: "Commodity", geo: "Global", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.5, aum: 46246, div_yield: 0.0, cap: null, style: null, perf: {"1D": 0.0, "1W": 1.6, "1M": -25.4, "3M": -10.8, "6M": 51.6, "YTD": -3.5, "1Y": 102.6, "2Y": 181.0, "3Y": 196.0}, tags: ["commodity", "global", "precious metals", "commodities"] },
  { ticker: "IAU", name: "iShares Gold Trust", sector: "Commodities", industry: "Precious Metals", asset_class: "Commodity", geo: "Global", provider: "iShares", risk: "Moderate", esg: false, expense: 0.25, aum: 83821, div_yield: 0.0, cap: null, style: null, perf: {"1D": 0.0, "1W": 2.6, "1M": -14.3, "3M": -0.5, "6M": 19.7, "YTD": 4.2, "1Y": 47.3, "2Y": 106.9, "3Y": 127.0}, tags: ["commodity", "global", "precious metals", "commodities"] },
  { ticker: "GDX", name: "VanEck Gold Miners ETF", sector: "Commodities", industry: "Gold Miners", asset_class: "Commodity", geo: "Global", provider: "VanEck", risk: "Aggressive", esg: false, expense: 0.51, aum: 36500, div_yield: 0.5, cap: "Mid", style: "Value", perf: {"1D": 0.0, "1W": 2.9, "1M": -25.9, "3M": -6.0, "6M": 15.7, "YTD": 0.1, "1Y": 88.8, "2Y": 193.1, "3Y": 175.0}, tags: ["gold miners", "commodity", "global", "commodities"] },
  { ticker: "DBA", name: "Invesco DB Agriculture Fund", sector: "Commodities", industry: "Agriculture", asset_class: "Commodity", geo: "Global", provider: "Invesco", risk: "Moderately Aggressive", esg: false, expense: 0.85, aum: 746, div_yield: 3.5, cap: null, style: null, perf: {"1D": 0.0, "1W": 1.2, "1M": 4.4, "3M": 5.9, "6M": 4.3, "YTD": 6.3, "1Y": 6.5, "2Y": 18.9, "3Y": 51.4}, tags: ["agriculture", "global", "dividends", "commodity", "commodities"] },
  { ticker: "USO", name: "United States Oil Fund, LP", sector: "Commodities", industry: "Oil", asset_class: "Commodity", geo: "Global", provider: "USCF", risk: "Aggressive", esg: false, expense: 0.72, aum: 1137, div_yield: 0.0, cap: null, style: null, perf: {"1D": 0.0, "1W": 12.3, "1M": 51.6, "3M": 81.4, "6M": 61.3, "YTD": 80.1, "1Y": 64.5, "2Y": 59.7, "3Y": 92.4}, tags: ["commodity", "oil", "global", "commodities"] },
  { ticker: "DBC", name: "Invesco DB Commodity Index Tracking Fund", sector: "Commodities", industry: "Diversified Commodities", asset_class: "Commodity", geo: "Global", provider: "Invesco", risk: "Moderate", esg: false, expense: 0.85, aum: 1403, div_yield: 3.0, cap: null, style: null, perf: {"1D": 0.0, "1W": 4.9, "1M": 15.9, "3M": 28.2, "6M": 31.9, "YTD": 30.0, "1Y": 35.1, "2Y": 38.4, "3Y": 41.5}, tags: ["diversified commodities", "global", "dividends", "commodity", "commodities"] },
  { ticker: "SCHD", name: "Schwab U.S. Dividend Equity ETF", sector: "Broad Market", industry: "Dividend Focus", asset_class: "Equity", geo: "US", provider: "Schwab", risk: "Moderately Conservative", esg: false, expense: 0.06, aum: 85904, div_yield: 3.3, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -0.3, "1M": -4.2, "3M": 10.1, "6M": 13.0, "YTD": 9.8, "1Y": 13.0, "2Y": 23.0, "3Y": 42.1}, tags: ["value", "broad market", "dividends", "dividend focus"] },
  { ticker: "VIG", name: "Vanguard Dividend Appreciation Index Fund ETF Shares", sector: "Broad Market", industry: "Dividend Growth", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.06, aum: 123751, div_yield: 1.6, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -2.0, "1M": -7.5, "3M": -5.3, "6M": -1.4, "YTD": -4.5, "1Y": 9.6, "2Y": 20.6, "3Y": 48.0}, tags: ["growth", "value", "broad market", "dividend growth"] },
  { ticker: "VYM", name: "Vanguard High Dividend Yield Index Fund ETF Shares", sector: "Broad Market", industry: "High Dividend", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderately Conservative", esg: false, expense: 0.06, aum: 92321, div_yield: 2.3, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -0.7, "1M": -5.5, "3M": 1.0, "6M": 4.8, "YTD": 1.2, "1Y": 15.9, "2Y": 29.3, "3Y": 54.3}, tags: ["value", "broad market", "high dividend"] },
  { ticker: "DVY", name: "iShares Select Dividend ETF", sector: "Broad Market", industry: "Dividend Select", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.38, aum: 22861, div_yield: 3.3, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 1.3, "1M": -3.6, "3M": 5.6, "6M": 7.8, "YTD": 5.6, "1Y": 15.9, "2Y": 33.7, "3Y": 46.8}, tags: ["value", "broad market", "dividend select", "dividends"] },
  { ticker: "HDV", name: "iShares Core High Dividend ETF", sector: "Broad Market", industry: "High Dividend", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.08, aum: 13758, div_yield: 2.8, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": 1.4, "1M": -3.2, "3M": 11.3, "6M": 12.1, "YTD": 11.0, "1Y": 16.5, "2Y": 33.5, "3Y": 50.5}, tags: ["value", "broad market", "high dividend"] },
  { ticker: "DGRO", name: "iShares Core Dividend Growth ETF", sector: "Broad Market", industry: "Dividend Growth", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderately Conservative", esg: false, expense: 0.08, aum: 38826, div_yield: 2.0, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -0.9, "1M": -6.3, "3M": -1.4, "6M": 2.8, "YTD": -0.8, "1Y": 13.8, "2Y": 26.0, "3Y": 51.7}, tags: ["growth", "value", "broad market", "dividend growth"] },
  { ticker: "JEPI", name: "JPMorgan Equity Premium Income ETF", sector: "Broad Market", industry: "Covered Call Strategy", asset_class: "Equity", geo: "US", provider: "JPMorgan", risk: "Moderately Conservative", esg: false, expense: 0.35, aum: 44962, div_yield: 7.9, cap: "Large", style: "Value", perf: {"1D": 0.0, "1W": -1.8, "1M": -6.7, "3M": -2.4, "6M": 1.3, "YTD": -1.9, "1Y": 5.2, "2Y": 13.3, "3Y": 31.4}, tags: ["covered call strategy", "broad market", "dividends"] },
  { ticker: "JEPQ", name: "JPMorgan Nasdaq Equity Premium Income ETF", sector: "Technology", industry: "Covered Call Strategy", asset_class: "Equity", geo: "US", provider: "JPMorgan", risk: "Moderately Aggressive", esg: false, expense: 0.35, aum: 34604, div_yield: 10.6, cap: "Large", style: "Growth", perf: {"1D": 0.0, "1W": -3.9, "1M": -5.9, "3M": -6.3, "6M": -0.4, "YTD": -5.2, "1Y": 14.2, "2Y": 23.7, "3Y": 67.9}, tags: ["covered call strategy", "technology", "dividends"] },
  { ticker: "IBIT", name: "iShares Bitcoin Trust ETF", sector: "Digital Assets", industry: "Cryptocurrency", asset_class: "Crypto", geo: "Global", provider: "iShares", risk: "Aggressive", esg: false, expense: 0.25, aum: 50147, div_yield: 0.0, cap: null, style: null, perf: {"1D": 0.0, "1W": -6.6, "1M": 0.6, "3M": -24.6, "6M": -39.6, "YTD": -26.6, "1Y": -24.4, "2Y": -7.8, "3Y": 40.4}, tags: ["crypto", "cryptocurrency", "global", "digital assets"] },
  { ticker: "ETHE", name: "Grayscale Ethereum Staking ETF", sector: "Digital Assets", industry: "Cryptocurrency", asset_class: "Crypto", geo: "Global", provider: "Grayscale", risk: "Aggressive", esg: false, expense: 0.25, aum: 1669, div_yield: 0.7, cap: null, style: null, perf: {"1D": 0.0, "1W": -7.8, "1M": 3.3, "3M": -32.3, "6M": -50.9, "YTD": -36.4, "1Y": -2.6, "2Y": -33.2, "3Y": 120.9}, tags: ["crypto", "cryptocurrency", "global", "digital assets"] },
  { ticker: "ESGU", name: "iShares ESG Aware MSCI USA ETF", sector: "Broad Market", industry: "ESG Large Cap", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderate", esg: true, expense: 0.15, aum: 15716, div_yield: 1.0, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.4, "1M": -7.4, "3M": -8.4, "6M": -4.2, "YTD": -7.4, "1Y": 12.6, "2Y": 23.4, "3Y": 63.7}, tags: ["sustainable", "broad market", "esg large cap", "esg"] },
  { ticker: "ESGV", name: "Vanguard ESG U.S. Stock ETF", sector: "Broad Market", industry: "ESG Total Market", asset_class: "Equity", geo: "US", provider: "Vanguard", risk: "Moderate", esg: true, expense: 0.09, aum: 11685, div_yield: 0.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.9, "1M": -8.2, "3M": -10.9, "6M": -6.9, "YTD": -9.8, "1Y": 10.4, "2Y": 20.2, "3Y": 62.9}, tags: ["sustainable", "broad market", "esg", "esg total market"] },
  { ticker: "SUSA", name: "iShares ESG Optimized MSCI USA ETF", sector: "Broad Market", industry: "ESG Select", asset_class: "Equity", geo: "US", provider: "iShares", risk: "Moderate", esg: true, expense: 0.25, aum: 3696, div_yield: 0.9, cap: "Large", style: "Blend", perf: {"1D": 0.0, "1W": -3.5, "1M": -7.6, "3M": -8.5, "6M": -3.9, "YTD": -7.4, "1Y": 12.0, "2Y": 21.6, "3Y": 57.7}, tags: ["sustainable", "broad market", "esg", "esg select"] },
  { ticker: "ARKW", name: "ARK Next Generation Internet ETF", sector: "Technology", industry: "Next Gen Internet", asset_class: "Equity", geo: "US", provider: "ARK Invest", risk: "Aggressive", esg: false, expense: 0.82, aum: 1596, div_yield: 1.9, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -9.0, "1M": -7.4, "3M": -23.7, "6M": -30.6, "YTD": -22.4, "1Y": 17.0, "2Y": 40.4, "3Y": 138.6}, tags: ["technology", "next gen internet"] },
  { ticker: "LIT", name: "Global X Lithium & Battery Tech ETF", sector: "Materials", industry: "Lithium & Battery", asset_class: "Equity", geo: "US", provider: "Global X", risk: "Aggressive", esg: false, expense: 0.75, aum: 1792, div_yield: 0.4, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": 2.9, "1M": -4.6, "3M": 6.2, "6M": 29.8, "YTD": 8.5, "1Y": 79.8, "2Y": 63.3, "3Y": 20.5}, tags: ["lithium & battery", "materials"] },
  { ticker: "REMX", name: "VanEck Rare Earth and Strategic Metals ETF", sector: "Materials", industry: "Rare Earth Metals", asset_class: "Equity", geo: "US", provider: "VanEck", risk: "Aggressive", esg: false, expense: 0.69, aum: 3042, div_yield: 1.3, cap: "Small", style: "Value", perf: {"1D": 0.0, "1W": 3.0, "1M": -13.8, "3M": 12.2, "6M": 33.1, "YTD": 12.1, "1Y": 109.7, "2Y": 79.1, "3Y": 12.4}, tags: ["rare earth metals", "materials"] },
  { ticker: "HERO", name: "Global X Video Games & Esports ETF", sector: "Technology", industry: "Video Games & Esports", asset_class: "Equity", geo: "US", provider: "Global X", risk: "Aggressive", esg: false, expense: 0.5, aum: 88, div_yield: 1.8, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -2.3, "1M": -8.3, "3M": -15.6, "6M": -24.2, "YTD": -16.4, "1Y": -1.4, "2Y": 26.8, "3Y": 31.7}, tags: ["video games & esports", "technology"] },
  { ticker: "BETZ", name: "Roundhill Sports Betting & iGaming ETF", sector: "Technology", industry: "Sports Betting & iGaming", asset_class: "Equity", geo: "US", provider: "Roundhill", risk: "Aggressive", esg: false, expense: 0.75, aum: 52, div_yield: 5.2, cap: "Mid", style: "Growth", perf: {"1D": 0.0, "1W": -5.6, "1M": -5.4, "3M": -18.0, "6M": -26.1, "YTD": -17.1, "1Y": -7.5, "2Y": 2.5, "3Y": 19.1}, tags: ["technology", "dividends", "sports betting & igaming"] },
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

// ─── Performance Range Options (for chip-based selection) ───
const PERF_RANGE_OPTIONS = [
  { key: "positive", label: "Positive", min: 0.01, max: Infinity },
  { key: "negative", label: "Negative", min: -Infinity, max: -0.01 },
  { key: "up_0_10", label: "0–10%", min: 0, max: 10 },
  { key: "up_10_25", label: "10–25%", min: 10, max: 25 },
  { key: "up_25_50", label: "25–50%", min: 25, max: 50 },
  { key: "up_50", label: "50%+", min: 50, max: Infinity },
  { key: "down_0_10", label: "Down 0–10%", min: -10, max: 0 },
  { key: "down_10_25", label: "Down 10–25%", min: -25, max: -10 },
  { key: "down_25", label: "Down 25%+", min: -Infinity, max: -25 },
];

function SingleChipSelect({ options, value, onChange, disabledOptions }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {options.map(({ key, label }) => {
        const active = value === key;
        const disabled = disabledOptions && !disabledOptions[key] && !active;
        return (
          <button key={key} onClick={() => {
            if (disabled) return;
            onChange(active ? "any" : key);
          }}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: active ? "var(--accent-light)" : disabled ? "var(--bg)" : "var(--surface)",
              color: active ? "var(--accent)" : disabled ? "var(--border-strong)" : "var(--text-muted)",
              cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease",
              fontFamily: "'DM Sans', sans-serif",
              opacity: disabled ? 0.45 : 1,
            }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

function ChipSelect({ options, selected, onToggle, disabledOptions, multi = true }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        const disabled = disabledOptions && disabledOptions.has ? !disabledOptions.has(opt) : false;
        return (
          <button key={opt} onClick={() => !disabled && onToggle(opt)}
            style={{
              padding: "5px 14px", borderRadius: 20, fontSize: 12, fontWeight: 500,
              border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: active ? "var(--accent-light)" : disabled ? "var(--bg)" : "var(--surface)",
              color: active ? "var(--accent)" : disabled ? "var(--border-strong)" : "var(--text-muted)",
              cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease",
              fontFamily: "'DM Sans', sans-serif",
              opacity: disabled ? 0.45 : 1,
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
          { t: "Sample & Illustrative Data Only", p: "All data displayed in this application is sample, illustrative, and approximate. It is NOT real-time data, NOT live market data, and is NOT sourced from or endorsed by any financial data provider, stock exchange, or fund company. Performance figures, expense ratios, AUM, dividend yields, and all other metrics shown are approximate values used solely for demonstration purposes and may not reflect actual current or historical values. Do not rely on any data shown in this application for any purpose." },
          { t: "Technology Demonstration", p: "This application exists solely as a technology demonstration showcasing modern web development techniques including React, responsive design, and interactive data filtering. It is a portfolio project and is not intended to serve as a financial tool, investment research platform, or data terminal of any kind." },
          { t: "Not Investment Advice", p: "Nothing presented in this application constitutes investment advice, financial advice, trading advice, or any other form of professional advice. No investment decisions should be made based on any information displayed here." },
          { t: "No Affiliation", p: "This application is not affiliated with, endorsed by, or connected to any ETF provider, fund company, stock exchange, financial data vendor, or financial institution. Any ETF names, ticker symbols, or fund provider names referenced are trademarks of their respective owners and are used here for identification purposes only within this technology demonstration." },
          { t: "No Fiduciary Relationship", p: "Use of this application does not create a fiduciary, advisory, or professional relationship between you and the creator of this application. The creator is not a registered investment advisor, broker-dealer, or financial planner." },
          { t: "Past Performance", p: "Even where approximate historical performance figures are shown, past performance is not indicative of future results. All investments involve risk, including the possible loss of principal." },
          { t: "No Warranty on Data", p: "The data presented is provided 'as is' without warranty of any kind, express or implied. The creator makes no representations regarding the accuracy, completeness, currentness, or reliability of any data shown. Data may contain errors, omissions, or be significantly outdated." },
          { t: "Consult a Professional", p: "Before making any investment decisions, you should consult with a qualified financial advisor, tax professional, or other appropriate professional who can consider your specific circumstances, risk tolerance, and financial goals." },
          { t: "Risk of Loss", p: "Investing in ETFs involves risk, including the potential loss of principal. Different types of ETFs carry different levels of risk. This application does not assess, evaluate, or make any representations about the risk of any particular investment." },
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

// ─── Responsive hook — tracks window width so components can adapt to screen size ───
function useWindowWidth() {
  const [width, setWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const handle = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);
  return width;
}

// ─── Main App ───
export default function ETFFinderApp() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;
  const [sectors, setSectors] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [riskCats, setRiskCats] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [matchedInterests, setMatchedInterests] = useState([]);
  const [perfFilters, setPerfFilters] = useState({});
  // Phase 2 filters
  const [assetClasses, setAssetClasses] = useState([]);
  const [geoFocus, setGeoFocus] = useState([]);
  const [providers, setProviders] = useState([]);
  const [esgOnly, setEsgOnly] = useState(false);
  const [expenseFilter, setExpenseFilter] = useState("any");
  const [aumFilter, setAumFilter] = useState("any");
  const [divYieldFilter, setDivYieldFilter] = useState("any");
  const [styleBoxSelection, setStyleBoxSelection] = useState([]);

  const [sortCol, setSortCol] = useState("ticker");
  const [sortDir, setSortDir] = useState("asc");
  const [showDisclosure, setShowDisclosure] = useState(false);
  const [etfPackage, setEtfPackage] = useState([]);
  const [detailETF, setDetailETF] = useState(null);
  const [expandedTicker, setExpandedTicker] = useState(null);
  const [packageOpen, setPackageOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(typeof window !== "undefined" ? window.innerWidth >= 768 : true);
  const PAGE_SIZE = 8;

  // Initialize telemetry on first render
  useEffect(() => { initTelemetry('etf-finder'); }, []);

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
    if (matches.length > 0) {
      trackEvent('interest_search', { query: searchText.slice(0, 50), matches: matches.map(m => m.label) });
    }
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
      // Phase 2 filters
      if (assetClasses.length > 0 && !assetClasses.includes(etf.asset_class)) return false;
      if (geoFocus.length > 0 && !geoFocus.includes(etf.geo)) return false;
      if (providers.length > 0 && !providers.includes(etf.provider)) return false;
      if (esgOnly && !etf.esg) return false;
      if (styleBoxSelection.length > 0) {
        if (!etf.cap || !etf.style) return false;
        if (!styleBoxSelection.includes(etf.cap + "-" + etf.style)) return false;
      }
      // Expense ratio
      if (expenseFilter !== "any") {
        const e = etf.expense;
        if (expenseFilter === "u010" && e >= 0.10) return false;
        if (expenseFilter === "010_025" && (e < 0.10 || e >= 0.25)) return false;
        if (expenseFilter === "025_050" && (e < 0.25 || e >= 0.50)) return false;
        if (expenseFilter === "050_100" && (e < 0.50 || e >= 1.00)) return false;
        if (expenseFilter === "100p" && e < 1.00) return false;
      }
      // AUM
      if (aumFilter !== "any") {
        const a = etf.aum;
        if (aumFilter === "u1b" && a >= 1000) return false;
        if (aumFilter === "1b_10b" && (a < 1000 || a >= 10000)) return false;
        if (aumFilter === "10b_50b" && (a < 10000 || a >= 50000)) return false;
        if (aumFilter === "50b_100b" && (a < 50000 || a >= 100000)) return false;
        if (aumFilter === "100bp" && a < 100000) return false;
      }
      // Dividend yield
      if (divYieldFilter !== "any") {
        const d = etf.div_yield;
        if (divYieldFilter === "none" && d > 0.1) return false;
        if (divYieldFilter === "0_1" && (d < 0 || d >= 1)) return false;
        if (divYieldFilter === "1_3" && (d < 1 || d >= 3)) return false;
        if (divYieldFilter === "3_5" && (d < 3 || d >= 5)) return false;
        if (divYieldFilter === "5p" && d < 5) return false;
      }
      // Performance ranges
      for (const [range, rangeKey] of Object.entries(perfFilters)) {
        if (!rangeKey) continue;
        const opt = PERF_RANGE_OPTIONS.find(o => o.key === rangeKey);
        if (!opt) continue;
        const val = etf.perf[range];
        if (opt.min !== -Infinity && val < opt.min) return false;
        if (opt.max !== Infinity && val > opt.max) return false;
      }
      if (matchedInterests.length > 0) {
        const allTags = matchedInterests.flatMap(m => m.tags);
        const hasMatch = etf.tags.some(t => allTags.some(mt => t.includes(mt) || mt.includes(t)));
        if (!hasMatch) return false;
      }
      return true;
    });
  }, [sectors, industries, riskCats, perfFilters, matchedInterests, assetClasses, geoFocus, providers, esgOnly, expenseFilter, aumFilter, divYieldFilter, styleBoxSelection]);

  // Track filter changes — debounced to avoid spamming on rapid clicks
  const filterTrackTimer = useRef(null);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    if (filterTrackTimer.current) clearTimeout(filterTrackTimer.current);
    filterTrackTimer.current = setTimeout(() => {
      const activeFilters = {};
      if (sectors.length) activeFilters.sectors = sectors;
      if (industries.length) activeFilters.industries = industries;
      if (riskCats.length) activeFilters.risk = riskCats;
      if (assetClasses.length) activeFilters.assetClass = assetClasses;
      if (geoFocus.length) activeFilters.geo = geoFocus;
      if (providers.length) activeFilters.providers = providers;
      if (esgOnly) activeFilters.esg = true;
      if (expenseFilter !== "any") activeFilters.expense = expenseFilter;
      if (aumFilter !== "any") activeFilters.aum = aumFilter;
      if (divYieldFilter !== "any") activeFilters.divYield = divYieldFilter;
      if (Object.keys(perfFilters).length) activeFilters.perf = perfFilters;
      if (styleBoxSelection.length) activeFilters.style = styleBoxSelection;
      if (Object.keys(activeFilters).length > 0) {
        trackEvent('filter_applied', { filters: activeFilters, results: filtered.length });
      }
    }, 500);
  }, [sectors, industries, riskCats, perfFilters, assetClasses, geoFocus, providers, esgOnly, expenseFilter, aumFilter, divYieldFilter, styleBoxSelection, filtered.length]);

  // Faceted availability — compute which filter options would produce results
  // For each filter category, we re-run the filter WITHOUT that category's constraint
  // to see which options are still reachable given all other active filters
  const facets = useMemo(() => {
    const applyFilters = (etf, skip) => {
      if (skip !== "sector" && sectors.length > 0 && !sectors.includes(etf.sector)) return false;
      if (skip !== "industry" && industries.length > 0 && !industries.includes(etf.industry)) return false;
      if (skip !== "risk" && riskCats.length > 0 && !riskCats.includes(etf.risk)) return false;
      if (skip !== "assetClass" && assetClasses.length > 0 && !assetClasses.includes(etf.asset_class)) return false;
      if (skip !== "geo" && geoFocus.length > 0 && !geoFocus.includes(etf.geo)) return false;
      if (skip !== "provider" && providers.length > 0 && !providers.includes(etf.provider)) return false;
      if (skip !== "esg" && esgOnly && !etf.esg) return false;
      if (skip !== "style" && styleBoxSelection.length > 0) {
        if (!etf.cap || !etf.style) return false;
        if (!styleBoxSelection.includes(etf.cap + "-" + etf.style)) return false;
      }
      if (skip !== "expense" && expenseFilter !== "any") {
        const e = etf.expense;
        if (expenseFilter === "u010" && e >= 0.10) return false;
        if (expenseFilter === "010_025" && (e < 0.10 || e >= 0.25)) return false;
        if (expenseFilter === "025_050" && (e < 0.25 || e >= 0.50)) return false;
        if (expenseFilter === "050_100" && (e < 0.50 || e >= 1.00)) return false;
        if (expenseFilter === "100p" && e < 1.00) return false;
      }
      if (skip !== "aum" && aumFilter !== "any") {
        const a = etf.aum;
        if (aumFilter === "u1b" && a >= 1000) return false;
        if (aumFilter === "1b_10b" && (a < 1000 || a >= 10000)) return false;
        if (aumFilter === "10b_50b" && (a < 10000 || a >= 50000)) return false;
        if (aumFilter === "50b_100b" && (a < 50000 || a >= 100000)) return false;
        if (aumFilter === "100bp" && a < 100000) return false;
      }
      if (skip !== "divYield" && divYieldFilter !== "any") {
        const d = etf.div_yield;
        if (divYieldFilter === "none" && d > 0.1) return false;
        if (divYieldFilter === "0_1" && (d < 0 || d >= 1)) return false;
        if (divYieldFilter === "1_3" && (d < 1 || d >= 3)) return false;
        if (divYieldFilter === "3_5" && (d < 3 || d >= 5)) return false;
        if (divYieldFilter === "5p" && d < 5) return false;
      }
      for (const [range, rangeKey] of Object.entries(perfFilters)) {
        if (!rangeKey) continue;
        if (skip === "perf:" + range) continue;
        const opt = PERF_RANGE_OPTIONS.find(o => o.key === rangeKey);
        if (!opt) continue;
        const val = etf.perf[range];
        if (opt.min !== -Infinity && val < opt.min) return false;
        if (opt.max !== Infinity && val > opt.max) return false;
      }
      if (matchedInterests.length > 0) {
        const allTags = matchedInterests.flatMap(m => m.tags);
        const hasMatch = etf.tags.some(t => allTags.some(mt => t.includes(mt) || mt.includes(t)));
        if (!hasMatch) return false;
      }
      return true;
    };

    const collect = (skip, field) => {
      const vals = new Set();
      ETF_DATA.forEach(etf => { if (applyFilters(etf, skip)) vals.add(etf[field]); });
      return vals;
    };

    // For each active perf period, check which range options have matching ETFs
    const perfAvail = {};
    for (const range of PERF_RANGES) {
      if (perfFilters[range] === undefined) continue;
      const avail = {};
      PERF_RANGE_OPTIONS.forEach(opt => {
        avail[opt.key] = ETF_DATA.some(etf => {
          if (!applyFilters(etf, "perf:" + range)) return false;
          const val = etf.perf[range];
          if (opt.min !== -Infinity && val < opt.min) return false;
          if (opt.max !== Infinity && val > opt.max) return false;
          return true;
        });
      });
      perfAvail[range] = avail;
    }

    // For dropdown filters, check which bucket values have matches
    const checkExpense = (key) => {
      return ETF_DATA.some(etf => {
        if (!applyFilters(etf, "expense")) return false;
        const e = etf.expense;
        if (key === "u010") return e < 0.10;
        if (key === "010_025") return e >= 0.10 && e < 0.25;
        if (key === "025_050") return e >= 0.25 && e < 0.50;
        if (key === "050_100") return e >= 0.50 && e < 1.00;
        if (key === "100p") return e >= 1.00;
        return true;
      });
    };
    const checkAum = (key) => {
      return ETF_DATA.some(etf => {
        if (!applyFilters(etf, "aum")) return false;
        const a = etf.aum;
        if (key === "u1b") return a < 1000;
        if (key === "1b_10b") return a >= 1000 && a < 10000;
        if (key === "10b_50b") return a >= 10000 && a < 50000;
        if (key === "50b_100b") return a >= 50000 && a < 100000;
        if (key === "100bp") return a >= 100000;
        return true;
      });
    };
    const checkDivYield = (key) => {
      return ETF_DATA.some(etf => {
        if (!applyFilters(etf, "divYield")) return false;
        const d = etf.div_yield;
        if (key === "none") return d <= 0.1;
        if (key === "0_1") return d >= 0 && d < 1;
        if (key === "1_3") return d >= 1 && d < 3;
        if (key === "3_5") return d >= 3 && d < 5;
        if (key === "5p") return d >= 5;
        return true;
      });
    };

    return {
      sectors: collect("sector", "sector"),
      industries: collect("industry", "industry"),
      risks: collect("risk", "risk"),
      assetClasses: collect("assetClass", "asset_class"),
      geos: collect("geo", "geo"),
      providers: collect("provider", "provider"),
      hasEsg: ETF_DATA.some(etf => etf.esg && applyFilters(etf, "esg")),
      expense: { u010: checkExpense("u010"), "010_025": checkExpense("010_025"), "025_050": checkExpense("025_050"), "050_100": checkExpense("050_100"), "100p": checkExpense("100p") },
      aum: { u1b: checkAum("u1b"), "1b_10b": checkAum("1b_10b"), "10b_50b": checkAum("10b_50b"), "50b_100b": checkAum("50b_100b"), "100bp": checkAum("100bp") },
      divYield: { none: checkDivYield("none"), "0_1": checkDivYield("0_1"), "1_3": checkDivYield("1_3"), "3_5": checkDivYield("3_5"), "5p": checkDivYield("5p") },
      styleCells: (() => {
        const s = new Set();
        ETF_DATA.forEach(etf => { if (etf.cap && etf.style && applyFilters(etf, "style")) s.add(etf.cap + "-" + etf.style); });
        return s;
      })(),
      perfAvail,
    };
  }, [sectors, industries, riskCats, perfFilters, matchedInterests, assetClasses, geoFocus, providers, esgOnly, expenseFilter, aumFilter, divYieldFilter, styleBoxSelection]);

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
    trackEvent('sort_changed', { column: col });
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  const clearAll = () => {
    trackEvent('filter_cleared', { action: 'clear_all' });
    setSectors([]); setIndustries([]); setRiskCats([]);
    setSearchText(""); setMatchedInterests([]);
    setPerfFilters({});
    setAssetClasses([]); setGeoFocus([]); setProviders([]);
    setEsgOnly(false); setExpenseFilter("any"); setAumFilter("any"); setDivYieldFilter("any");
    setStyleBoxSelection([]);
    setPage(0);
  };

  const addToPackage = (etf) => {
    if (!etfPackage.find(e => e.ticker === etf.ticker)) {
      trackEvent('etf_added_to_package', { ticker: etf.ticker, sector: etf.sector });
      setEtfPackage(prev => [...prev, etf]);
    }
  };
  const removeFromPackage = (ticker) => {
    trackEvent('etf_removed_from_package', { ticker });
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
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .etf-row:hover { background: var(--surface-hover) !important; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border-strong); }
        .mobile-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 200; animation: fadeIn 0.2s ease; }
        .mobile-sidebar { position: fixed; left: 0; top: 0; bottom: 0; width: 85%; max-width: 360px; z-index: 201;
          background: var(--surface); overflow-y: auto; animation: slideInLeft 0.25s ease;
          padding: 20px 20px 100px; box-shadow: 4px 0 24px rgba(0,0,0,0.1); }
        @media (max-width: 767px) {
          .hide-mobile { display: none !important; }
          .mobile-compact-cell { padding: 6px 8px !important; }
        }
        @media (min-width: 768px) and (max-width: 1023px) {
          .hide-tablet { display: none !important; }
        }
      `}</style>

      <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* ─── Header ─── */}
        <header style={{
          background: "var(--surface)", borderBottom: "1px solid var(--border)",
          padding: isMobile ? "12px 16px" : "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, zIndex: 100, flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 14 }}>
            <div style={{
              width: isMobile ? 32 : 38, height: isMobile ? 32 : 38, borderRadius: 10, background: "linear-gradient(135deg, var(--accent), #818CF8)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: isMobile ? 14 : 16, fontFamily: "'Outfit', sans-serif",
            }}>E</div>
            <div>
              <h1 style={{ fontSize: isMobile ? 16 : 20, fontWeight: 700, fontFamily: "'Outfit', sans-serif", color: "var(--text-primary)", lineHeight: 1.1 }}>
                ETF Finder
              </h1>
              {!isMobile && <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                Discover and compare exchange-traded funds
              </p>}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
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
            <button onClick={() => { setSidebarOpen(s => !s); trackEvent('sidebar_toggled', { action: sidebarOpen ? 'close' : 'open' }); }} style={{
              background: sidebarOpen && !isMobile ? "var(--accent-light)" : "var(--surface)",
              border: sidebarOpen && !isMobile ? "1px solid var(--accent)" : "1px solid var(--border)", borderRadius: 8,
              padding: isMobile ? "8px 14px" : "6px 14px", fontSize: 13, cursor: "pointer",
              color: sidebarOpen && !isMobile ? "var(--accent)" : "var(--text-secondary)",
              fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
            }}>
              {isMobile ? "Filters" : (sidebarOpen ? "Hide Filters" : "Show Filters")}
            </button>
          </div>
        </header>

        {/* ─── Main Content ─── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          
          {/* ─── Sidebar — mobile: overlay, desktop: side panel ─── */}
          {sidebarOpen && isMobile && (
            <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
          )}
          {sidebarOpen && (
            <aside className={isMobile ? "mobile-sidebar" : ""} style={isMobile ? {} : {
              width: isTablet ? 280 : 320, minWidth: isTablet ? 280 : 320, background: "var(--surface)", borderRight: "1px solid var(--border)",
              padding: "20px 20px 100px", overflowY: "auto", animation: "fadeIn 0.2s ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>Filters</span>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <button onClick={clearAll} style={{
                    background: "none", border: "none", color: "var(--accent)", fontSize: 12,
                    fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>Clear all</button>
                  {isMobile && (
                    <button onClick={() => setSidebarOpen(false)} style={{
                      background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 8,
                      width: 32, height: 32, cursor: "pointer", fontSize: 16, color: "var(--text-muted)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>×</button>
                  )}
                </div>
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
                <ChipSelect options={RISK_CATEGORIES} selected={riskCats} onToggle={toggleChip(riskCats, setRiskCats)} disabledOptions={facets.risks} />
              </FilterSection>

              {/* Sector */}
              <FilterSection title="Sector" defaultOpen={true}>
                <ChipSelect options={SECTORS} selected={sectors} disabledOptions={facets.sectors} onToggle={(val) => {
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
                <ChipSelect options={availableIndustries} selected={industries} onToggle={toggleChip(industries, setIndustries)} disabledOptions={facets.industries} />
              </FilterSection>

              {/* Performance */}
              <FilterSection title="Performance Ranges" defaultOpen={false}>
                {/* Step 1: Time period chips */}
                <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>Select time periods to filter:</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {PERF_RANGES.map(range => {
                    const isActive = perfFilters[range] !== undefined;
                    return (
                      <button key={range} onClick={() => {
                        setPerfFilters(prev => {
                          const next = { ...prev };
                          if (next[range] !== undefined) { delete next[range]; } else { next[range] = null; }
                          return next;
                        });
                        setPage(0);
                      }}
                        style={{
                          padding: "5px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
                          border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                          background: isActive ? "var(--accent-light)" : "var(--surface)",
                          color: isActive ? "var(--accent)" : "var(--text-muted)",
                          cursor: "pointer", transition: "all 0.15s ease",
                          fontFamily: "'JetBrains Mono', monospace",
                        }}>
                        {range}
                      </button>
                    );
                  })}
                </div>

                {/* Step 2: For each active period, show range chips */}
                {PERF_RANGES.filter(r => perfFilters[r] !== undefined).map(range => (
                  <div key={range} style={{
                    marginBottom: 10, padding: "8px 10px", borderRadius: 8,
                    background: "var(--bg)", border: "1px solid var(--border)",
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", marginBottom: 6, fontFamily: "'JetBrains Mono', monospace" }}>
                      {range} {perfFilters[range] ? "· " + PERF_RANGE_OPTIONS.find(o => o.key === perfFilters[range])?.label : "· select range"}
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {PERF_RANGE_OPTIONS.map(opt => {
                        const active = perfFilters[range] === opt.key;
                        const available = facets.perfAvail[range] ? facets.perfAvail[range][opt.key] : true;
                        const disabled = !available && !active;
                        return (
                          <button key={opt.key} onClick={() => {
                            if (disabled) return;
                            setPerfFilters(prev => ({
                              ...prev,
                              [range]: active ? null : opt.key,
                            }));
                            setPage(0);
                          }}
                            style={{
                              padding: "3px 10px", borderRadius: 14, fontSize: 11, fontWeight: 500,
                              border: active ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                              background: active ? "var(--accent-light)" : disabled ? "var(--bg)" : "var(--surface)",
                              color: active ? "var(--accent)" : disabled ? "var(--border-strong)" : "var(--text-muted)",
                              cursor: disabled ? "default" : "pointer", transition: "all 0.15s ease",
                              fontFamily: "'DM Sans', sans-serif",
                              opacity: disabled ? 0.45 : 1,
                            }}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {Object.keys(perfFilters).length > 0 && (
                  <button onClick={() => { setPerfFilters({}); setPage(0); }} style={{
                    background: "none", border: "none", color: "var(--accent)", fontSize: 11,
                    fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                  }}>Clear all performance filters</button>
                )}
              </FilterSection>

              {/* ── Phase 2 Filters ── */}

              {/* Asset Class */}
              <FilterSection title="Asset Class" defaultOpen={false}>
                <ChipSelect options={ASSET_CLASSES} selected={assetClasses} onToggle={toggleChip(assetClasses, setAssetClasses)} disabledOptions={facets.assetClasses} />
              </FilterSection>

              {/* Geographic Focus */}
              <FilterSection title="Geographic Focus" defaultOpen={false}>
                <ChipSelect options={GEO_OPTIONS} selected={geoFocus} onToggle={toggleChip(geoFocus, setGeoFocus)} disabledOptions={facets.geos} />
              </FilterSection>

              {/* Expense Ratio */}
              <FilterSection title="Expense Ratio" defaultOpen={false}>
                <SingleChipSelect
                  value={expenseFilter}
                  onChange={v => { setExpenseFilter(v); setPage(0); }}
                  disabledOptions={facets.expense}
                  options={[
                    { key: "u010", label: "Under 0.10%" },
                    { key: "010_025", label: "0.10–0.25%" },
                    { key: "025_050", label: "0.25–0.50%" },
                    { key: "050_100", label: "0.50–1.00%" },
                    { key: "100p", label: "1.00%+" },
                  ]}
                />
              </FilterSection>

              {/* AUM */}
              <FilterSection title="Assets Under Management" defaultOpen={false}>
                <SingleChipSelect
                  value={aumFilter}
                  onChange={v => { setAumFilter(v); setPage(0); }}
                  disabledOptions={facets.aum}
                  options={[
                    { key: "u1b", label: "Under $1B" },
                    { key: "1b_10b", label: "$1B–$10B" },
                    { key: "10b_50b", label: "$10B–$50B" },
                    { key: "50b_100b", label: "$50B–$100B" },
                    { key: "100bp", label: "$100B+" },
                  ]}
                />
              </FilterSection>

              {/* Dividend Yield */}
              <FilterSection title="Dividend Yield" defaultOpen={false}>
                <SingleChipSelect
                  value={divYieldFilter}
                  onChange={v => { setDivYieldFilter(v); setPage(0); }}
                  disabledOptions={facets.divYield}
                  options={[
                    { key: "none", label: "None (0%)" },
                    { key: "0_1", label: "0–1%" },
                    { key: "1_3", label: "1–3%" },
                    { key: "3_5", label: "3–5%" },
                    { key: "5p", label: "5%+" },
                  ]}
                />
              </FilterSection>

              {/* Fund Provider */}
              <FilterSection title="Fund Provider" defaultOpen={false}>
                <ChipSelect options={PROVIDERS} selected={providers} onToggle={toggleChip(providers, setProviders)} disabledOptions={facets.providers} />
              </FilterSection>

              {/* ESG Toggle */}
              <FilterSection title="ESG / Sustainability" defaultOpen={false}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, opacity: !facets.hasEsg && !esgOnly ? 0.45 : 1 }}>
                  <button onClick={() => { if (facets.hasEsg || esgOnly) { setEsgOnly(v => !v); setPage(0); } }}
                    style={{
                      width: 44, height: 24, borderRadius: 12, border: "none",
                      cursor: facets.hasEsg || esgOnly ? "pointer" : "default",
                      background: esgOnly ? "var(--green)" : "var(--border)",
                      position: "relative", transition: "background 0.2s ease",
                      flexShrink: 0,
                    }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: 9, background: "#fff",
                      position: "absolute", top: 3,
                      left: esgOnly ? 23 : 3,
                      transition: "left 0.2s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                    }} />
                  </button>
                  <span style={{ fontSize: 12, color: esgOnly ? "var(--green)" : "var(--text-muted)", fontWeight: 500 }}>
                    {esgOnly ? "Showing ESG-rated only" : "Show all funds"}
                  </span>
                </div>
              </FilterSection>

              {/* Investment Style Box */}
              <FilterSection title="Investment Style" defaultOpen={false}>
                <div style={{ marginBottom: 6 }}>
                  {/* Column headers */}
                  <div style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 2, marginBottom: 2 }}>
                    <div />
                    {["Value", "Blend", "Growth"].map(s => (
                      <div key={s} style={{ textAlign: "center", fontSize: 10, fontWeight: 600, color: "var(--text-muted)", padding: "4px 0" }}>{s}</div>
                    ))}
                  </div>
                  {/* Grid rows */}
                  {["Large", "Mid", "Small"].map(cap => (
                    <div key={cap} style={{ display: "grid", gridTemplateColumns: "40px 1fr 1fr 1fr", gap: 2, marginBottom: 2 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "flex-end", paddingRight: 6 }}>{cap}</div>
                      {["Value", "Blend", "Growth"].map(sty => {
                        const key = cap + "-" + sty;
                        const isActive = styleBoxSelection.includes(key);
                        const available = facets.styleCells.has(key);
                        const count = ETF_DATA.filter(e => e.cap === cap && e.style === sty).length;
                        return (
                          <button key={key} onClick={() => {
                            if (!available && !isActive) return;
                            setStyleBoxSelection(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
                            setPage(0);
                          }} style={{
                            aspectRatio: "1", border: isActive ? "2px solid var(--accent)" : "1.5px solid var(--border)",
                            borderRadius: 6, cursor: available || isActive ? "pointer" : "default", transition: "all 0.15s ease",
                            background: isActive ? "var(--accent-light)" : available ? "var(--surface)" : "var(--bg)",
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            opacity: available || isActive ? 1 : 0.3,
                          }}>
                            <span style={{
                              fontSize: 14, fontWeight: 700,
                              fontFamily: "'JetBrains Mono', monospace",
                              color: isActive ? "var(--accent)" : available ? "var(--text-primary)" : "var(--border-strong)",
                            }}>{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
                {styleBoxSelection.length > 0 && (
                  <button onClick={() => setStyleBoxSelection([])} style={{
                    background: "none", border: "none", color: "var(--accent)", fontSize: 11,
                    fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif", marginTop: 4,
                  }}>Clear style selection</button>
                )}
              </FilterSection>
            </aside>
          )}

          {/* ─── Results ─── */}
          <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

            {/* ═══ Active Filter Summary ═══ */}
            {(() => {
              const chips = [];
              if (searchText.trim()) chips.push({ label: "Interest: " + searchText, onRemove: () => setSearchText("") });
              riskCats.forEach(r => chips.push({ label: "Risk: " + r, onRemove: () => setRiskCats(prev => prev.filter(v => v !== r)) }));
              sectors.forEach(s => chips.push({ label: "Sector: " + s, onRemove: () => {
                const next = sectors.filter(v => v !== s);
                setSectors(next);
                if (next.length > 0) {
                  const valid = new Set();
                  next.forEach(sec => (INDUSTRIES_BY_SECTOR[sec] || new Set()).forEach(i => valid.add(i)));
                  setIndustries(prev => prev.filter(i => valid.has(i)));
                }
              }}));
              industries.forEach(ind => chips.push({ label: "Industry: " + ind, onRemove: () => setIndustries(prev => prev.filter(v => v !== ind)) }));
              Object.entries(perfFilters).forEach(([range, key]) => {
                if (key) {
                  const opt = PERF_RANGE_OPTIONS.find(o => o.key === key);
                  chips.push({ label: range + ": " + (opt?.label || key), onRemove: () => setPerfFilters(prev => { const n = { ...prev }; delete n[range]; return n; }) });
                }
              });
              assetClasses.forEach(a => chips.push({ label: "Asset: " + a, onRemove: () => setAssetClasses(prev => prev.filter(v => v !== a)) }));
              geoFocus.forEach(g => chips.push({ label: "Geo: " + g, onRemove: () => setGeoFocus(prev => prev.filter(v => v !== g)) }));
              if (expenseFilter !== "any") {
                const labels = { u010: "Under 0.10%", "010_025": "0.10–0.25%", "025_050": "0.25–0.50%", "050_100": "0.50–1.00%", "100p": "1.00%+" };
                chips.push({ label: "Expense: " + (labels[expenseFilter] || expenseFilter), onRemove: () => setExpenseFilter("any") });
              }
              if (aumFilter !== "any") {
                const labels = { u1b: "Under $1B", "1b_10b": "$1B–$10B", "10b_50b": "$10B–$50B", "50b_100b": "$50B–$100B", "100bp": "$100B+" };
                chips.push({ label: "AUM: " + (labels[aumFilter] || aumFilter), onRemove: () => setAumFilter("any") });
              }
              if (divYieldFilter !== "any") {
                const labels = { none: "None", "0_1": "0–1%", "1_3": "1–3%", "3_5": "3–5%", "5p": "5%+" };
                chips.push({ label: "Yield: " + (labels[divYieldFilter] || divYieldFilter), onRemove: () => setDivYieldFilter("any") });
              }
              providers.forEach(p => chips.push({ label: "Provider: " + p, onRemove: () => setProviders(prev => prev.filter(v => v !== p)) }));
              if (esgOnly) chips.push({ label: "ESG Only", onRemove: () => setEsgOnly(false) });
              styleBoxSelection.forEach(s => chips.push({ label: "Style: " + s, onRemove: () => setStyleBoxSelection(prev => prev.filter(v => v !== s)) }));

              if (chips.length === 0) return null;

              return (
                <div style={{
                  padding: "8px 16px", background: "var(--surface)", borderBottom: "1px solid var(--border)",
                  display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center", flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500, marginRight: 2 }}>Active filters:</span>
                  {chips.map((chip, i) => (
                    <span key={i} style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "3px 10px", borderRadius: 14, fontSize: 11, fontWeight: 500,
                      background: "var(--accent-light)", color: "var(--accent)",
                      border: "1px solid var(--accent)",
                    }}>
                      {chip.label}
                      <span onClick={(e) => { e.stopPropagation(); chip.onRemove(); setPage(0); }}
                        style={{ cursor: "pointer", fontSize: 13, lineHeight: 1, fontWeight: 700, opacity: 0.7 }}
                        onMouseEnter={e => e.target.style.opacity = 1}
                        onMouseLeave={e => e.target.style.opacity = 0.7}
                      >×</span>
                    </span>
                  ))}
                  <button onClick={clearAll} style={{
                    background: "none", border: "none", color: "var(--red)", fontSize: 11,
                    fontWeight: 600, cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
                    marginLeft: 4,
                  }}>Clear all</button>
                </div>
              );
            })()}

            {/* ═══ SECTION 1: Search Results — fills available space, scrolls internally ═══ */}
            <div style={{
              flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
              background: "var(--bg)", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                background: "var(--surface)", flexShrink: 0,
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
                <span className="hide-mobile" style={{ fontSize: 11, color: "var(--text-muted)" }}>Click row to expand · Click + to add</span>
              </div>
              <div style={{
                padding: "6px 16px", background: "var(--amber-bg)", borderBottom: "1px solid var(--border)",
                fontSize: 11, color: "var(--amber)", fontWeight: 500, flexShrink: 0,
              }}>
                Sample data for demonstration only — not real-time, not live, not for investment decisions
              </div>
              <div style={{ flex: 1, overflowY: "auto", overflowX: "auto", background: "var(--bg)" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", minWidth: isMobile ? 400 : 820, background: "var(--surface)" }}>
                  <thead>
                    <tr>
                      <th style={{
                        padding: "8px 12px", width: 44, background: "var(--surface)",
                        borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2,
                      }}></th>
                      <SortHeader col="ticker" label="Ticker" width="72px" />
                      <SortHeader col="name" label="Name" width={isMobile ? "140px" : "220px"} />
                      <th className="hide-mobile" style={{ padding: "8px 12px", background: "var(--surface)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}><span onClick={() => handleSort("sector")} style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: sortCol === "sector" ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>SECTOR {sortCol === "sector" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span></th>
                      <th className="hide-mobile hide-tablet" style={{ padding: "8px 12px", background: "var(--surface)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}><span onClick={() => handleSort("risk")} style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: sortCol === "risk" ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase" }}>RISK {sortCol === "risk" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span></th>
                      <th className="hide-mobile hide-tablet" style={{ padding: "8px 12px", textAlign: "right", background: "var(--surface)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}><span onClick={() => handleSort("expense")} style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: sortCol === "expense" ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>EXP. {sortCol === "expense" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span></th>
                      <th className="hide-mobile" style={{ padding: "8px 12px", textAlign: "right", background: "var(--surface)", borderBottom: "2px solid var(--border)", position: "sticky", top: 0, zIndex: 2 }}><span onClick={() => handleSort("div_yield")} style={{ cursor: "pointer", fontSize: 11, fontWeight: 600, color: sortCol === "div_yield" ? "var(--accent)" : "var(--text-muted)", letterSpacing: "0.04em", textTransform: "uppercase", fontFamily: "'JetBrains Mono', monospace" }}>YIELD {sortCol === "div_yield" ? (sortDir === "asc" ? "↑" : "↓") : ""}</span></th>
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
                            onClick={() => {
                              const expanding = !isExpanded;
                              setExpandedTicker(expanding ? etf.ticker : null);
                              trackEvent(expanding ? 'etf_expanded' : 'etf_collapsed', { ticker: etf.ticker, sector: etf.sector });
                            }}
                            style={{
                              borderBottom: isExpanded ? "none" : "1px solid var(--border)",
                              background: inPkg ? "var(--accent-light)" : "transparent",
                              animation: `slideUp 0.12s ease ${i * 0.015}s both`,
                              cursor: "pointer",
                            }}>
                            <td style={{ padding: "8px 12px", textAlign: "center" }}
                              onClick={e => e.stopPropagation()}>
                              <button onClick={() => { inPkg ? removeFromPackage(etf.ticker) : addToPackage(etf); if (!packageOpen && !inPkg) setPackageOpen(true); }}
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
                            <td style={{ padding: "8px 12px", fontSize: 11, color: "var(--text-muted)" }} className="hide-mobile">{etf.sector}</td>
                            <td style={{ padding: "8px 12px" }} className="hide-mobile hide-tablet">
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
                            <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }} className="hide-mobile hide-tablet">
                              {etf.expense.toFixed(2)}%
                            </td>
                            <td style={{ padding: "8px 12px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)" }} className="hide-mobile">
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
                                      onClick={(e) => { e.stopPropagation(); inPkg ? removeFromPackage(etf.ticker) : addToPackage(etf); if (!packageOpen && !inPkg) setPackageOpen(true); }}
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
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                    {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, sorted.length)} of {sorted.length}
                  </span>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button disabled={page === 0} onClick={() => { setPage(p => p - 1); trackEvent('page_changed', { direction: 'prev' }); }}
                      style={{
                        padding: "4px 12px", borderRadius: 6, border: "1px solid var(--border)",
                        background: "var(--surface)", cursor: page === 0 ? "default" : "pointer",
                        fontSize: 11, fontWeight: 500, color: page === 0 ? "var(--border-strong)" : "var(--text-secondary)",
                        fontFamily: "'DM Sans', sans-serif",
                      }}>← Prev</button>
                    <button disabled={page >= totalPages - 1} onClick={() => { setPage(p => p + 1); trackEvent('page_changed', { direction: 'next' }); }}
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

            {/* ═══ SECTION 2: Selected Package — collapsible sticky bottom panel ═══ */}
            <div style={{ flexShrink: 0, borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
              {/* Clickable header bar — always visible */}
              <button onClick={() => setPackageOpen(p => !p)} style={{
                width: "100%", padding: "10px 16px", border: "none", background: "var(--surface)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: "pointer", borderBottom: packageOpen ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
                    Your ETF Package
                  </span>
                  {etfPackage.length > 0 ? (
                    <span style={{
                      background: "var(--accent)", color: "#fff", fontSize: 11, fontWeight: 700,
                      padding: "2px 9px", borderRadius: 10, minWidth: 20, textAlign: "center",
                    }}>{etfPackage.length}</span>
                  ) : (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>empty</span>
                  )}
                  {!packageOpen && etfPackage.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                      {etfPackage.map(e => e.ticker).join(", ")}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {etfPackage.length > 0 && (
                    <span onClick={(e) => { e.stopPropagation(); setEtfPackage([]); setDetailETF(null); trackEvent('package_cleared', {}); }} style={{
                      fontSize: 11, color: "var(--red)", fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                    }}>Clear</span>
                  )}
                  <span style={{
                    fontSize: 12, color: "var(--text-muted)",
                    transform: packageOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease", display: "inline-block",
                  }}>▾</span>
                </div>
              </button>

              {/* Expandable content */}
              {packageOpen && (
                <div style={{ maxHeight: 180, overflowY: "auto", animation: "slideUp 0.15s ease" }}>
                  {etfPackage.length === 0 ? (
                    <div style={{ padding: "20px 16px", textAlign: "center" }}>
                      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                        Use the + button in search results to build your package.
                      </p>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, padding: 12 }}>
                      {etfPackage.map(etf => {
                        const isActive = detailETF?.ticker === etf.ticker;
                        return (
                          <div key={etf.ticker}
                            onClick={() => { setDetailETF(isActive ? null : etf); if (!detailsOpen) setDetailsOpen(true); }}
                            style={{
                              display: "flex", alignItems: "center", gap: 10,
                              padding: "8px 12px", borderRadius: 8, cursor: "pointer",
                              border: isActive ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
                              background: isActive ? "var(--accent-light)" : "var(--bg)",
                              transition: "all 0.15s ease", minWidth: 160,
                            }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                                  {etf.ticker}
                                </span>
                                <span style={{
                                  fontSize: 10, fontWeight: 600,
                                  color: etf.perf["1Y"] >= 0 ? "var(--green)" : "var(--red)",
                                  fontFamily: "'JetBrains Mono', monospace",
                                }}>{fmt(etf.perf["1Y"])}</span>
                              </div>
                              <div style={{ fontSize: 10, color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 1 }}>
                                {etf.name}
                              </div>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeFromPackage(etf.ticker); }}
                              style={{
                                width: 20, height: 20, borderRadius: 6, border: "none",
                                background: "transparent", color: "var(--text-muted)", cursor: "pointer",
                                fontSize: 13, display: "flex", alignItems: "center", justifyContent: "center",
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
              )}
            </div>

            {/* ═══ SECTION 3: Details — collapsible sticky bottom panel ═══ */}
            <div style={{ flexShrink: 0, background: "var(--surface)" }}>
              {/* Clickable header bar — always visible */}
              <button onClick={() => { if (etfPackage.length > 0) setDetailsOpen(d => !d); }} style={{
                width: "100%", padding: "10px 16px", border: "none", background: "var(--surface)",
                display: "flex", justifyContent: "space-between", alignItems: "center",
                cursor: etfPackage.length > 0 ? "pointer" : "default",
                borderBottom: detailsOpen ? "1px solid var(--border)" : "none",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'Outfit', sans-serif" }}>
                    Details
                  </span>
                  {detailETF && (
                    <span style={{ fontSize: 11, color: "var(--accent)", fontWeight: 600, fontFamily: "'JetBrains Mono', monospace" }}>
                      {detailETF.ticker}
                    </span>
                  )}
                  {!detailETF && etfPackage.length > 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>package overview</span>
                  )}
                  {etfPackage.length === 0 && (
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>add ETFs to view</span>
                  )}
                </div>
                {etfPackage.length > 0 && (
                  <span style={{
                    fontSize: 12, color: "var(--text-muted)",
                    transform: detailsOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease", display: "inline-block",
                  }}>▾</span>
                )}
              </button>

              {/* Expandable content */}
              {detailsOpen && etfPackage.length > 0 && (
                <div style={{ maxHeight: 350, overflowY: "auto", animation: "slideUp 0.15s ease" }}>
                  {detailETF ? (
                    /* ── Individual ETF Detail View ── */
                    <div style={{ padding: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 18, fontWeight: 800, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>
                              {detailETF.ticker}
                            </span>
                            <span style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
                              background: "var(--accent-light)", color: "var(--accent)",
                            }}>{detailETF.asset_class}</span>
                            {detailETF.esg && <span style={{
                              fontSize: 10, fontWeight: 600, padding: "2px 9px", borderRadius: 10,
                              background: "var(--green-bg)", color: "var(--green)",
                            }}>ESG</span>}
                          </div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>{detailETF.name}</p>
                          <p style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
                            {detailETF.provider} · {detailETF.sector} · {detailETF.industry} · {detailETF.geo}
                          </p>
                        </div>
                        <button onClick={() => setDetailETF(null)} style={{
                          background: "var(--bg)", border: "1px solid var(--border)", borderRadius: 6,
                          padding: "4px 12px", cursor: "pointer", fontSize: 11, color: "var(--text-muted)",
                          fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
                        }}>Overview</button>
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "Expense Ratio", value: detailETF.expense.toFixed(2) + "%" },
                          { label: "AUM", value: fmtAum(detailETF.aum) },
                          { label: "Div. Yield", value: detailETF.div_yield.toFixed(1) + "%" },
                          { label: "Risk Level", value: detailETF.risk },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            background: "var(--bg)", borderRadius: 8, padding: "8px 10px",
                            border: "1px solid var(--border)",
                          }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Performance</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5, marginBottom: 10 }}>
                        {PERF_RANGES.map(r => {
                          const v = detailETF.perf[r];
                          return (
                            <div key={r} style={{
                              background: v >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                              borderRadius: 7, padding: "6px 4px", textAlign: "center",
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

                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {detailETF.tags.map(t => (
                          <span key={t} style={{
                            fontSize: 10, color: "var(--text-muted)", background: "var(--bg)",
                            border: "1px solid var(--border)", padding: "2px 8px", borderRadius: 10,
                          }}>#{t}</span>
                        ))}
                      </div>
                    </div>
                  ) : packageStats ? (
                    /* ── Package Overview ── */
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>
                        Package summary — {etfPackage.length} ETF{etfPackage.length !== 1 ? "s" : ""}
                      </div>

                      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 }}>
                        {[
                          { label: "Avg Expense", value: packageStats.avgExpense.toFixed(2) + "%" },
                          { label: "Combined AUM", value: fmtAum(packageStats.totalAum) },
                          { label: "Avg Div. Yield", value: packageStats.avgDivYield.toFixed(1) + "%" },
                          { label: "Sectors", value: packageStats.sectors.length },
                        ].map(({ label, value }) => (
                          <div key={label} style={{
                            background: "var(--bg)", borderRadius: 8, padding: "8px 10px",
                            border: "1px solid var(--border)",
                          }}>
                            <div style={{ fontSize: 9, color: "var(--text-muted)", marginBottom: 2, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.03em" }}>{label}</div>
                            <div style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Average performance</div>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(9, 1fr)", gap: 5, marginBottom: 12 }}>
                        {PERF_RANGES.map(r => {
                          const v = packageStats.avgPerf[r];
                          return (
                            <div key={r} style={{
                              background: v >= 0 ? "var(--green-bg)" : "var(--red-bg)",
                              borderRadius: 7, padding: "6px 4px", textAlign: "center",
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

                      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-primary)", marginBottom: 6 }}>Fund comparison</div>
                      <div style={{ overflowX: "auto" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid var(--border)" }}>
                              <th style={{ padding: "6px 8px", textAlign: "left", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>Fund</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>Expense</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>Yield</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>YTD</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>1Y</th>
                              <th style={{ padding: "6px 8px", textAlign: "right", fontWeight: 600, color: "var(--text-muted)", fontSize: 10, textTransform: "uppercase" }}>3Y</th>
                            </tr>
                          </thead>
                          <tbody>
                            {etfPackage.map(etf => (
                              <tr key={etf.ticker} className="etf-row"
                                style={{ borderBottom: "1px solid var(--border)", cursor: "pointer" }}
                                onClick={() => setDetailETF(etf)}>
                                <td style={{ padding: "7px 8px" }}>
                                  <span style={{ fontWeight: 700, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{etf.ticker}</span>
                                </td>
                                <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                                  {etf.expense.toFixed(2)}%
                                </td>
                                <td style={{ padding: "7px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: "var(--text-secondary)" }}>
                                  {etf.div_yield.toFixed(1)}%
                                </td>
                                <td style={{
                                  padding: "7px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: 600, color: etf.perf["YTD"] >= 0 ? "var(--green)" : "var(--red)",
                                }}>{fmt(etf.perf["YTD"])}</td>
                                <td style={{
                                  padding: "7px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: 600, color: etf.perf["1Y"] >= 0 ? "var(--green)" : "var(--red)",
                                }}>{fmt(etf.perf["1Y"])}</td>
                                <td style={{
                                  padding: "7px 8px", textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                                  fontWeight: 600, color: etf.perf["3Y"] >= 0 ? "var(--green)" : "var(--red)",
                                }}>{fmt(etf.perf["3Y"])}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 5 }}>
                        {packageStats.sectors.map(s => {
                          const count = etfPackage.filter(e => e.sector === s).length;
                          return (
                            <span key={s} style={{
                              fontSize: 10, padding: "3px 10px", borderRadius: 10,
                              background: "var(--accent-light)", color: "var(--accent)", fontWeight: 600,
                            }}>{s} ({count})</span>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </main>
        </div>

        {/* ─── Footer ─── */}
        <footer style={{
          background: "var(--surface)", borderTop: "1px solid var(--border)",
          padding: isMobile ? "10px 16px" : "16px 32px",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8,
          flexShrink: 0,
        }}>
          <p style={{ fontSize: isMobile ? 10 : 12, color: "var(--text-muted)", lineHeight: 1.5, maxWidth: 700 }}>
            <strong style={{ color: "var(--text-secondary)" }}>Disclaimer:</strong> {isMobile ? "Sample data only. Not real-time. Not investment advice." : "All data shown is sample and illustrative only — not real-time, not live, and not sourced from any financial data provider. This is a technology demonstration. Not investment advice. Do not use for investment decisions."}
          </p>
          <button onClick={() => { setShowDisclosure(true); trackEvent('disclosure_opened', {}); }} style={{
            background: "var(--accent-light)", border: "1px solid var(--accent)",
            borderRadius: 8, padding: isMobile ? "6px 12px" : "7px 18px", fontSize: isMobile ? 11 : 12, fontWeight: 600,
            color: "var(--accent)", cursor: "pointer", fontFamily: "'DM Sans', sans-serif",
            whiteSpace: "nowrap",
          }}>
            {isMobile ? "Disclosures" : "Full Disclosures →"}
          </button>
        </footer>
      </div>

      {showDisclosure && <DisclosureModal onClose={() => setShowDisclosure(false)} />}
    </>
  );
}
