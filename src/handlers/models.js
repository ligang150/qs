// Models handler
import { readModels, readModelConfigsFromSheet } from '../tencent-api.js';
import { jsonResponse } from '../utils.js';

let cachedModels = null;
let modelsCacheTime = 0;
const MODELS_CACHE_TTL = 300000; // 5 minutes

// Model config (for merging)
const MODEL_CONFIG_KEYS = [
  "F5631","F3500","C210","C220","C230","C240A","C3050A","C280",
  "330N","F3600","C204","C307","C305","C310",
  "4110B","5118G","R4110","6001C","R403",
  "R6207","R6205","R6048",
  "304铁桶","304吨桶",
  "350T","8001A","INOVOL R8315"
];

export async function handleModels(request) {
  try {
    const now = Date.now();
    if (cachedModels && now - modelsCacheTime < MODELS_CACHE_TTL) {
      return jsonResponse({ success: true, models: cachedModels, version: "cf-v1.0" });
    }

    let models = await readModels();
    if (models.length === 0) {
      models = [...MODEL_CONFIG_KEYS];
    } else {
      // Merge with hardcoded config
      const set = new Set(models);
      MODEL_CONFIG_KEYS.forEach(m => set.add(m));
      models = [...set];
    }

    cachedModels = models;
    modelsCacheTime = now;
    return jsonResponse({ success: true, models, version: "cf-v1.0" });
  } catch (e) {
    // Fallback to hardcoded models
    return jsonResponse({ success: true, models: [...MODEL_CONFIG_KEYS], version: "cf-v1.0-fallback" });
  }
}
