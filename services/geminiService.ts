import { GoogleGenAI } from "@google/genai";
import { Transaction } from "../types";

const getApiKey = (): string => {
    // In a real app, this would be process.env.API_KEY, but for this demo, 
    // we assume it's available or user provided.
    // Ideally, we handle this via environment variables.
    return process.env.API_KEY || '';
};

export const analyzeFinancialData = async (transactions: Transaction[]): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API Key is missing. Please configure your environment.");
  }

  const ai = new GoogleGenAI({ apiKey });

  // Prepare data for the prompt to reduce token count but keep relevance
  const summaryData = transactions.map(t => ({
    d: t.date,
    c: t.category,
    a: t.amount,
    t: t.type
  }));

  const prompt = `
    You are an expert restaurant financial consultant. Analyze the following monthly transaction data (JSON format).
    The currency is South African Rand (ZAR).
    
    Data: ${JSON.stringify(summaryData)}

    Please provide a professional financial report in Markdown format containing:
    1. **Executive Summary**: A brief overview of the financial health.
    2. **Key Metrics**: Calculate and comment on Prime Cost (Food/Bev COGS + All Labor) as a % of Total Income. Ideally, this should be under 60%.
    3. **Income Analysis**: Which revenue streams are performing best?
    4. **Expense Analysis**: Identify any alarming cost centers or outliers.
    5. **Recommendations**: 3 actionable steps to improve Net Profit for next month.

    Keep the tone professional, concise, and constructive. Use bolding and lists for readability.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to generate financial analysis.");
  }
};