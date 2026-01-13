
import { GoogleGenAI, Type } from "@google/genai";
import { NewsEvent, QuizQuestion } from "./types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateNewsEvent(year: number, pollution: number): Promise<NewsEvent> {
  const prompt = `Generate a realistic news event for a petroleum industry simulation game for the year ${year}. The current pollution level is ${pollution}/100. 
  The event should involve a dilemma between economy and environment.
  Return JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          impact: {
            type: Type.OBJECT,
            properties: {
              stat: { type: Type.STRING, description: "One of: cash, crudeOil, pollution, approval" },
              value: { type: Type.NUMBER }
            }
          },
          options: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                label: { type: Type.STRING },
                impact: {
                  type: Type.OBJECT,
                  properties: {
                    cash: { type: Type.NUMBER },
                    pollution: { type: Type.NUMBER },
                    approval: { type: Type.NUMBER }
                  }
                }
              }
            }
          }
        },
        required: ["title", "description", "impact"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateQuiz(): Promise<QuizQuestion> {
  const prompt = `Generate a challenging educational quiz question about petroleum formation, refining, or its environmental impact.
  Return JSON format.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 0 },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            minItems: 4,
            maxItems: 4
          },
          correctIndex: { type: Type.NUMBER },
          explanation: { type: Type.STRING }
        },
        required: ["question", "options", "correctIndex", "explanation"]
      }
    }
  });

  return JSON.parse(response.text);
}
