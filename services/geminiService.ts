
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const analyzeResume = async (resumeText: string, jobDescription: string) => {
  const model = 'gemini-3-flash-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: `
    Job Description: 
    ${jobDescription}
    
    Resume Text: 
    ${resumeText}`,
    config: {
      systemInstruction: `You are an elite Recruitment and ATS Optimization AI. 
      Your task is to analyze how well the provided Resume matches the specific Job Description (JD).
      
      Evaluation Criteria:
      1. Keyword Match: How many essential skills/tools from the JD appear in the resume?
      2. Role Alignment: Does the experience level and depth match the JD requirements?
      3. ATS Formatting: Is the resume structured in a way that modern ATS can parse efficiently?
      
      Response Requirements:
      - Provide a "Match Score" out of 100 based on the JD.
      - Identify specific "Missing Keywords" that the candidate should add.
      - Provide "Actionable Feedback" on how to tailor the resume for this specific role.
      - List 3-5 specific tasks for the Customer Success manager to help the client with.`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          keywordScore: { type: Type.NUMBER },
          formattingScore: { type: Type.NUMBER },
          experienceScore: { type: Type.NUMBER },
          overallScore: { type: Type.NUMBER },
          feedback: { type: Type.STRING },
          missingKeywords: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          suggestedTasks: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["keywordScore", "formattingScore", "experienceScore", "overallScore", "feedback", "missingKeywords", "suggestedTasks"]
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

export const optimizeResume = async (resumeText: string, jobDescription: string) => {
  const model = 'gemini-3-pro-preview';
  
  const response = await ai.models.generateContent({
    model,
    contents: `
    Job Description: 
    ${jobDescription}
    
    Current Resume: 
    ${resumeText}`,
    config: {
      systemInstruction: `You are a world-class professional resume writer. 
      Rewrite the provided resume into a structured format inspired by "Jake's Resume" (clean, technical, minimalist).
      Tailor every bullet point to the Job Description using keywords and quantifiable metrics.
      
      Structure:
      - Personal Info: Name, Email, Phone, LinkedIn, GitHub/Portfolio, Location.
      - Education: Institution, Location, Degree, Dates.
      - Experience: Company, Location, Job Title, Dates, and 3-5 high-impact bullet points.
      - Projects: Name, Technologies Used, and 2-3 bullet points.
      - Skills: Grouped by categories (e.g., Languages, Frameworks, Tools).`,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predictedScore: { type: Type.NUMBER },
          keyImprovements: { type: Type.ARRAY, items: { type: Type.STRING } },
          structuredResume: {
            type: Type.OBJECT,
            properties: {
              personalInfo: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  email: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  linkedin: { type: Type.STRING },
                  github: { type: Type.STRING },
                  location: { type: Type.STRING }
                },
                required: ["name", "email", "phone"]
              },
              education: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    institution: { type: Type.STRING },
                    location: { type: Type.STRING },
                    degree: { type: Type.STRING },
                    dates: { type: Type.STRING }
                  }
                }
              },
              experience: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    company: { type: Type.STRING },
                    location: { type: Type.STRING },
                    title: { type: Type.STRING },
                    dates: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              projects: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    technologies: { type: Type.STRING },
                    bullets: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              },
              skills: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING },
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                }
              }
            },
            required: ["personalInfo", "experience", "skills"]
          }
        },
        required: ["predictedScore", "keyImprovements", "structuredResume"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch (e) {
    console.error("Failed to parse AI optimization response", e);
    throw new Error("Optimization failed");
  }
};
