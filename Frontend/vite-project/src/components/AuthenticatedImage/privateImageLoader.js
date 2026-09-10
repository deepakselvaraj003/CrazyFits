import api from "../../api/axios";

// Maximum number of active Blob URLs stored in memory
const MAX_CACHE_SIZE = 50;

// Cache map: url => { blobUrl, timestamp }
const blobCache = new Map();
// Pending promises map: url => Promise<blobUrl>
const pendingRequests = new Map();

/**
 * Revokes a single cached Blob URL and removes it from the cache map.
 */
function revokeCacheEntry(url) {
  const entry = blobCache.get(url);
  if (entry) {
    if (entry.blobUrl) {
      URL.revokeObjectURL(entry.blobUrl);
    }
    blobCache.delete(url);
  }
}

/**
 * Enforces maximum cache size by revoking the oldest entries (LRU behavior).
 */
function evictOldestEntries() {
  while (blobCache.size > MAX_CACHE_SIZE) {
    const oldestKey = blobCache.keys().next().value;
    revokeCacheEntry(oldestKey);
  }
}

/**
 * Fetches a private image using the existing Axios instance with Bearer token authentication.
 * Returns a Promise that resolves to a Blob Object URL.
 */
export async function getAuthenticatedImageBlobUrl(url, options = {}) {
  if (!url) return null;

  // Check if already in cache
  if (blobCache.has(url)) {
    const entry = blobCache.get(url);
    // Refresh position in Map for LRU behavior
    blobCache.delete(url);
    blobCache.set(url, entry);
    return entry.blobUrl;
  }

  // Check if a request for this URL is already in-flight (deduplication)
  if (pendingRequests.has(url)) {
    return pendingRequests.get(url);
  }

  // Create a new request promise
  const requestPromise = (async () => {
    try {
      const response = await api.get(url, {
        responseType: "blob",
        signal: options.signal,
      });

      const blob = response.data;
      const blobUrl = URL.createObjectURL(blob);

      // Store in cache
      blobCache.set(url, { blobUrl, timestamp: Date.now() });
      evictOldestEntries();

      return blobUrl;
    } finally {
      pendingRequests.delete(url);
    }
  })();

  pendingRequests.set(url, requestPromise);
  return requestPromise;
}

/**
 * Downloads an image safely. Uses Axios with Bearer token for private proxy URLs,
 * and standard fetch for public URLs.
 */
export async function downloadAuthenticatedImage(url, filename) {
  if (!url) return;

  const isPrivate = url.includes("/media/proxy/");

  if (isPrivate) {
    const response = await api.get(url, { responseType: "blob" });
    const blobUrl = URL.createObjectURL(response.data);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  } else {
    // Public file (or gallery)
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(blobUrl);
  }
}
