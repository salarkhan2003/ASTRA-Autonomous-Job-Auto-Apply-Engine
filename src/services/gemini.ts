import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const searchJobs = async (keywords: string[]) => {
  const prompt = `Find 5 recent job openings for a fresher in India for the following roles: ${keywords.join(", ")}. 
  Candidate Profile: B.Tech EEE, CGPA 8.5, NASA Space Apps Winner, Efftronics Internship.
  Return the results as a JSON array of objects with: company, role, platform, job_url, and a brief reason why it's a good fit.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              company: { type: Type.STRING },
              role: { type: Type.STRING },
              platform: { type: Type.STRING },
              job_url: { type: Type.STRING },
              fit_reason: { type: Type.STRING }
            },
            required: ["company", "role", "platform", "job_url", "fit_reason"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
};

export const generateScreeningAnswer = async (question: string, profile: any) => {
  const prompt = `As a job application bot for ${profile.full_name}, answer the following screening question: "${question}".
  Candidate Context: ${JSON.stringify(profile)}.
  Provide a professional, concise answer (max 2 sentences).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt
    });
    return response.text;
  } catch (error) {
    console.error("Error generating answer:", error);
    return "I am highly interested in this role and believe my technical background in EEE and internship experience make me a strong fit.";
  }
};
