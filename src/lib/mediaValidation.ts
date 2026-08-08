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

export interface UploadResult {
  success: boolean;
  url?: string;
  title?: string;
  filename?: string;
  error?: string;
}

export const uploadVideoWithProgress = (
  file: File,
  onProgress?: (percent: number) => void
): Promise<UploadResult> => {
  return new Promise((resolve) => {
    const MAX_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      resolve({
        success: false,
        error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum limit of 500MB.`
      });
      return;
    }

    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('video', file);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.success && data.url) {
            resolve({
              success: true,
              url: data.url,
              title: data.title || file.name.replace(/\.[^/.]+$/, ""),
              filename: data.filename
            });
            return;
          }
          resolve({
            success: false,
            error: data?.error || 'Server responded with incomplete data.'
          });
        } catch (_e) {
          resolve({
            success: false,
            error: 'Failed to parse server response.'
          });
        }
      } else {
        let errMessage = `Server error HTTP ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText);
          if (data && data.error) errMessage = data.error;
        } catch (_e) {
          if (xhr.status === 413) {
            errMessage = 'File payload too large for server network limit.';
          }
        }
        resolve({
          success: false,
          error: errMessage
        });
      }
    };

    xhr.onerror = () => {
      resolve({
        success: false,
        error: 'Network error occurred while uploading to server.'
      });
    };

    xhr.ontimeout = () => {
      resolve({
        success: false,
        error: 'Upload timed out. Please try a smaller video file or direct URL.'
      });
    };

    xhr.timeout = 600000;
    xhr.open('POST', '/api/upload-video', true);
    xhr.send(formData);
  });
};

export interface HeaderCheckResult {
  isReachable: boolean;
  status?: number;
  contentType?: string;
  error?: string;
  retriesAttempted?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const verifyMediaSourceHeaders = async (
  url: string,
  timeoutMs: number = 5000,
  maxRetries: number = 2
): Promise<HeaderCheckResult> => {
  if (!url) return { isReachable: false, error: 'Empty media URL' };

  // Local uploads or YouTube videos bypass direct CORS HEAD request checks
  if (url.startsWith('/') || url.includes('youtube.com') || url.includes('youtu.be')) {
    return { isReachable: true };
  }

  let lastError = '';
  let lastStatus: number | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      // Exponential backoff delay between retries (e.g. 600ms, 1200ms)
      await sleep(attempt * 600);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method: 'HEAD',
          mode: 'cors',
          redirect: 'follow',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
      } catch (err: any) {
        clearTimeout(timeoutId);
        if (err.name === 'AbortError') {
          lastError = `Validation timed out after ${Math.round(timeoutMs / 1000)}s (Attempt ${attempt + 1}/${maxRetries + 1}).`;
          continue;
        }

        // Fallback: If HEAD method fails or is restricted by server CORS, attempt GET with range header for first byte
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), timeoutMs);

        try {
          response = await fetch(url, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            mode: 'cors',
            redirect: 'follow',
            signal: getController.signal,
          });
          clearTimeout(getTimeoutId);
        } catch (getErr: any) {
          clearTimeout(getTimeoutId);
          if (getErr.name === 'AbortError') {
            lastError = `Media reachability check timed out after ${Math.round(timeoutMs / 1000)}s.`;
            continue;
          }
          throw getErr;
        }
      }

      lastStatus = response.status;

      if (response.ok || response.status === 206) {
        const contentType = response.headers.get('content-type') || '';
        return {
          isReachable: true,
          status: response.status,
          contentType,
          retriesAttempted: attempt
        };
      }

      // If status is 403 Forbidden or 405 Method Not Allowed on HEAD, retry with a GET Range request
      if (response.status === 403 || response.status === 405) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), timeoutMs);
        try {
          const getResponse = await fetch(url, {
            method: 'GET',
            headers: { Range: 'bytes=0-0' },
            mode: 'cors',
            redirect: 'follow',
            signal: getController.signal,
          });
          clearTimeout(getTimeoutId);
          if (getResponse.ok || getResponse.status === 206) {
            return {
              isReachable: true,
              status: getResponse.status,
              contentType: getResponse.headers.get('content-type') || '',
              retriesAttempted: attempt
            };
          }
          lastStatus = getResponse.status;
        } catch (e) {
          clearTimeout(getTimeoutId);
        }
      }

      if (lastStatus === 403) {
        lastError = `Server returned HTTP 403 Forbidden. Access restricted, hotlink protected, or authorization token expired.`;
      } else if (lastStatus === 429) {
        lastError = `Server returned HTTP 429 Too Many Requests. Rate limit reached.`;
      } else {
        lastError = `Server returned HTTP ${lastStatus}. Video stream may be offline, restricted by CORS, or invalid.`;
      }

      // Non-recoverable errors: 404 Not Found or 410 Gone
      if (lastStatus === 404 || lastStatus === 410) {
        return {
          isReachable: false,
          status: lastStatus,
          error: `Media resource not found (HTTP ${lastStatus}). Please verify the URL.`
        };
      }
    } catch (err: any) {
      lastError = `Unable to reach media source or request was blocked by origin server CORS policy.`;
    }
  }

  return {
    isReachable: false,
    status: lastStatus,
    error: lastError || 'Unable to reach video source after retry attempts.',
    retriesAttempted: maxRetries
  };
};
