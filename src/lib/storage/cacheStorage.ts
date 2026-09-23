/**
 * 10-15 minute session and image cache storage.
 * Preserves the active page, tool, parameters, and loaded image
 * across page refreshes and tab reloads for 15 minutes.
 */

const CACHE_KEY = 'docuprep_active_session_cache_v1';
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

export interface CachedSessionData {
  timestamp: number;
  activeView: 'home' | 'tools' | 'editor' | 'pdf';
  activeToolId?: string;
  activePresetId?: string;
  pdfSubTool?: string;
  editorState?: {
    originalDataUrl?: string;
    filename?: string;
    originalSizeKb?: number;
    unit?: string;
    widthVal?: number;
    heightVal?: number;
    dpi?: number;
    outputFormat?: string;
    quality?: number;
    targetMaxKb?: number | null;
    customFilename?: string;
    activePresetId?: string;
  };
}

export function saveSessionCache(data: Omit<CachedSessionData, 'timestamp'>): void {
  try {
    const payload: CachedSessionData = {
      ...data,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
    // Also save in localStorage as fallback in case tab is reopened/refreshed
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (err) {
    console.warn('Failed to save session cache (quota exceeded or storage disabled):', err);
  }
}

export function loadSessionCache(): CachedSessionData | null {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY) || localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const data: CachedSessionData = JSON.parse(raw);
    const age = Date.now() - (data.timestamp || 0);

    // If cache is older than 15 minutes (900,000 ms), invalidate and discard it
    if (age > CACHE_TTL_MS || age < 0) {
      clearSessionCache();
      return null;
    }

    return data;
  } catch (err) {
    console.warn('Failed to load session cache:', err);
    return null;
  }
}

export function clearSessionCache(): void {
  try {
    sessionStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_KEY);
  } catch (err) {
    // Ignore error
  }
}
