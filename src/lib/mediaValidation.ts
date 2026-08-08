export interface MediaValidationResult {
  isValid: boolean;
  error?: string;
  type?: 'mp4' | 'youtube' | 'hls' | 'audio';
  url?: string;
}

export const validateMediaUrl = (url: string): MediaValidationResult => {
  if (!url || typeof url !== 'string') {
    return { isValid: false, error: 'Please enter a valid video URL or select a video file.' };
  }

  const trimmed = url.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Media URL cannot be empty.' };
  }

  // Allow server uploaded files
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/public/uploads/')) {
    return {
      isValid: true,
      type: 'mp4',
      url: trimmed
    };
  }

  // Validate URL structure for external links
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return { isValid: false, error: 'Media URL must use http:// or https:// protocol.' };
    }

    const host = parsed.hostname.toLowerCase();
    const isYouTube = host.includes('youtube.com') || host.includes('youtu.be');

    if (isYouTube) {
      return {
        isValid: true,
        type: 'youtube',
        url: trimmed
      };
    }

    if (parsed.pathname.endsWith('.m3u8')) {
      return {
        isValid: true,
        type: 'hls',
        url: trimmed
      };
    }

    return {
      isValid: true,
      type: 'mp4',
      url: trimmed
    };
  } catch {
    return { isValid: false, error: 'Invalid URL format. Please enter a valid address starting with https:// or select a video file.' };
  }
};
