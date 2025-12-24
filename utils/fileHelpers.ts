import { Catalog, Category, MediaFile, MediaType } from '../types';
import { GoogleGenAI } from "@google/genai";

let autoIdCounter = 0;
const getUniqueId = () => `item_${++autoIdCounter}_${Date.now()}`;

// Global cache to avoid redundant API calls between Selector and MediaCards
const aiImageCache: Record<string, string> = {};

const isImage = (name: string) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isVideo = (name: string) => /\.(mp4|webm|mov|mkv|avi)$/i.test(name);
const isAudio = (name: string) => /\.(mp3|wav|ogg|m4a|flac)$/i.test(name);

const guessType = (name: string): MediaType | null => {
  if (isVideo(name)) return MediaType.Video;
  if (isAudio(name)) return MediaType.Audio;
  return null;
};

const getBaseKey = (path: string) => path.replace(/\.[^.]+$/, '');

export const processFiles = (files: File[]): Catalog => {
  const catalog: Catalog = {
    ambient: [],
    visuals: [],
    music: [],
    musicGroups: {},
    thumbnails: {},
  };

  files.forEach((file) => {
    const pathParts = (file.webkitRelativePath || file.name).split('/');
    
    const ambientIdx = pathParts.findIndex(p => /^ambient$/i.test(p));
    const visualIdx = pathParts.findIndex(p => /^visuals?$/i.test(p));
    const musicIdx = pathParts.findIndex(p => /^music$/i.test(p));

    let category: Category | null = null;
    let categoryIdx = -1;

    if (ambientIdx !== -1) { category = Category.Ambient; categoryIdx = ambientIdx; }
    else if (visualIdx !== -1) { category = Category.Visual; categoryIdx = visualIdx; }
    else if (musicIdx !== -1) { category = Category.Music; categoryIdx = musicIdx; }

    if (!category || categoryIdx === -1) return;

    const relParts = pathParts.slice(categoryIdx + 1);
    const relPath = category + '/' + relParts.join('/');
    
    if (isImage(file.name)) {
      catalog.thumbnails[getBaseKey(relPath)] = file;
      return;
    }

    const mediaType = guessType(file.name);
    if (!mediaType) return;

    const item: MediaFile = {
      id: getUniqueId(),
      file,
      name: file.name,
      url: URL.createObjectURL(file),
      type: mediaType,
      category,
      relPath,
    };

    if (category === Category.Ambient) {
      catalog.ambient.push(item);
    } else if (category === Category.Visual) {
      catalog.visuals.push(item);
    } else if (category === Category.Music) {
      const group = relParts.length > 1 ? relParts.slice(0, -1).join('/') : '(Root)';
      item.group = group;
      catalog.music.push(item);
      if (!catalog.musicGroups[group]) catalog.musicGroups[group] = [];
      catalog.musicGroups[group].push(item);
    }
  });

  return catalog;
};

export const generateThumbnail = async (videoUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';
    video.currentTime = 1;
    video.muted = true;
    
    video.onloadeddata = () => {
        setTimeout(() => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = 400;
                canvas.height = 400;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Center crop logic for coherent aspect ratio
                    const size = Math.min(video.videoWidth, video.videoHeight);
                    const x = (video.videoWidth - size) / 2;
                    const y = (video.videoHeight - size) / 2;
                    ctx.drawImage(video, x, y, size, size, 0, 0, 400, 400);
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                } else {
                    resolve(null);
                }
            } catch (e) {
                resolve(null);
            }
        }, 300);
    };
    video.onerror = () => resolve(null);
  });
};

/**
 * Generates an AI illustration in the style of Chillhop.
 * Results are cached globally to ensure consistency between Selector and Mixer.
 */
export const generateAIThumbnail = async (title: string): Promise<string | null> => {
  // Check global cache first
  if (aiImageCache[title]) return aiImageCache[title];

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    // Coherent prompt: Central focus, no text, lo-fi aesthetic
    const prompt = `A centered, cozy Chillhop-style lo-fi illustration. Studio Ghibli anime aesthetic, warm lighting. Scene: "${title}". Soft pastel colors, digital art. Focal point must be in the center for 1:1 square aspect ratio compatibility. High quality, calm atmosphere, no text or watermarks.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64 = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        aiImageCache[title] = base64; // Save to cache
        return base64;
      }
    }
    return null;
  } catch (error) {
    console.error("AI Generation Error:", error);
    return null;
  }
};