
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { pcmToWavBlob } from "../utils/audioUtils";

// We create a new instance per call to ensure we capture the latest API key if managed via window.aistudio
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes journal entries to create a cinematic prompt and mood summary.
 */
export const analyzeJournalForVideo = async (entriesText: string): Promise<{ prompt: string; mood: string; script: string }> => {
  const ai = getAI();
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Analyze these journal entries and create inputs for an AI video generator and a voiceover artist.
    
    1. "prompt": A detailed visual description for a video generation model (Veo) that captures the essence.
    2. "mood": A single word describing the emotional tone.
    3. "script": A short, poetic 2-3 sentence voiceover script (max 30 words) summarizing the memory that would sound good spoken over the video.

    Journal Entries:
    ${entriesText.substring(0, 5000)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          prompt: { type: Type.STRING, description: "Visual prompt for Veo." },
          mood: { type: Type.STRING, description: "Mood word." },
          script: { type: Type.STRING, description: "Short voiceover script." }
        },
        required: ["prompt", "mood", "script"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text);
};

/**
 * Analyzes the user's life profile for the Life Cinema mode.
 */
export const analyzeLifeProfile = async (entriesText: string): Promise<{ 
  archetype: string; 
  traits: string[]; 
  musicalStyle: string; 
  lyrics: string;
  visualPrompt: string; 
}> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Read these journal entries deepy. You are a biographer and musical composer. 
    Construct a "Soul Profile" of this person based on their writings.
    
    1. "archetype": A 2-3 word creative title for their personality type (e.g., "The Melancholic Dreamer", "The Resilient Warrior").
    2. "traits": 3 key personality adjectives.
    3. "musicalStyle": Description of a theme song genre/instrumentation that fits their life (e.g., "Lo-fi piano with rain sounds", "Epic orchestral swell").
    4. "lyrics": A 4-line spoken-word poem or anthem lyrics that summarizes their life philosophy and journey.
    5. "visualPrompt": A highly symbolic, cinematic visual description for a video generator (Veo) that represents their "Life Movie". Abstract or metaphorical (e.g., "A lone figure walking through a golden wheat field at sunset, cinematic lighting").

    Journal Entries:
    ${entriesText.substring(0, 10000)}
    `,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          archetype: { type: Type.STRING },
          traits: { type: Type.ARRAY, items: { type: Type.STRING } },
          musicalStyle: { type: Type.STRING },
          lyrics: { type: Type.STRING },
          visualPrompt: { type: Type.STRING }
        },
        required: ["archetype", "traits", "musicalStyle", "lyrics", "visualPrompt"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from Gemini");
  return JSON.parse(text);
};

/**
 * Generates a video using Veo based on a prompt and optional reference image.
 */
export const generateCinematicMemory = async (prompt: string, base64Image?: string): Promise<string> => {
  const ai = getAI();
  
  // Ensure the prompt isn't too long for Veo
  const cleanPrompt = prompt.length > 400 ? prompt.substring(0, 400) : prompt;

  let operation;

  try {
    if (base64Image) {
      // Image-to-Video
      const cleanBase64 = base64Image.split(',')[1] || base64Image;
      
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: cleanPrompt,
        image: {
          imageBytes: cleanBase64,
          mimeType: 'image/jpeg',
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    } else {
      // Text-to-Video
      operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: cleanPrompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });
    }

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!videoUri) {
      throw new Error("Failed to generate video URI");
    }

    // Fetch the actual blob to play locally
    const downloadUrl = `${videoUri}&key=${process.env.API_KEY}`;
    const vidResponse = await fetch(downloadUrl);
    const blob = await vidResponse.blob();
    return URL.createObjectURL(blob);

  } catch (error) {
    console.error("Veo generation failed:", error);
    throw error;
  }
};

/**
 * Generates an audio voiceover for the journal entry.
 */
export const generateJournalAudio = async (script: string, voiceName: string = 'Fenrir'): Promise<string> => {
  const ai = getAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: script }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName }, 
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("No audio data returned");
  }

  // Convert raw PCM to WAV Blob URL
  const blob = pcmToWavBlob(base64Audio, 24000);
  return URL.createObjectURL(blob);
};

/**
 * Suggests tags for a journal entry.
 */
export const suggestTags = async (content: string, imageBase64?: string): Promise<string[]> => {
  const ai = getAI();
  
  const parts: any[] = [];
  
  if (imageBase64) {
      const cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
      parts.push({
          inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
          }
      });
  }
  
  let prompt = "Generate 3-5 relevant short tags for this journal entry.";
  if (content) {
      prompt += ` Text: "${content}"`;
  }
  if (imageBase64) {
      prompt += " Analyze the image visual content for tags.";
  }
  parts.push({ text: prompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: { type: Type.STRING }
      }
    }
  });
  
  const text = response.text;
  return text ? JSON.parse(text) : [];
};
