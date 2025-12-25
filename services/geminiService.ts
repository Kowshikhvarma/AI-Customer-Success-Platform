
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeResume = async (resumeText: string) => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: `Analyze the following resume text for ATS optimization. Provide scores and feedback. 
    Resume Text: ${resumeText}`,
    config: {
      systemInstruction: `You are an expert recruitment AI. 
      Analyze resumes for: 
      1. Keyword matching (technical and soft skills).
      2. Formatting (readability, structure).
      3. Experience depth (metrics, impact).
      
      Generate scores out of 100.
      Provide detailed constructive feedback and 3-4 specific tasks to improve the resume.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywordScore: { type: Type.NUMBER },
          formattingScore: { type: Type.NUMBER },
          experienceScore: { type: Type.NUMBER },
          overallScore: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          suggestedTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["keywordScore", "formattingScore", "experienceScore", "overallScore", "feedback", "suggestedTasks"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("Analysis failed");
  }
};
