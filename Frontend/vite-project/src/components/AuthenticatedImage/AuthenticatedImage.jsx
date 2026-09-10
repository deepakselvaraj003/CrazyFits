import { useEffect, useState, useRef } from "react";
import { getAuthenticatedImageBlobUrl } from "./privateImageLoader";

export default function AuthenticatedImage({
  src,
  alt = "",
  className = "",
  onLoad,
  onError,
  fallback = null,
  ...props
}) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const isMountedRef = useRef(true);

  const isPrivate = typeof src === "string" && src.includes("/media/proxy/");

  useEffect(() => {
    isMountedRef.current = true;

    if (!src) {
      setLoading(false);
      setError(true);
      return;
    }

    // For public URLs, pass through directly to standard <img src>
    if (!isPrivate) {
      setBlobUrl(src);
      setLoading(false);
      setError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(false);

    getAuthenticatedImageBlobUrl(src, { signal: controller.signal })
      .then((url) => {
        if (isMountedRef.current) {
          setBlobUrl(url);
          setLoading(false);
          setError(false);
        }
      })
      .catch((err) => {
        if (err?.name === "CanceledError" || err?.name === "AbortError" || err?.code === "ERR_CANCELED") {
          return; // Request was aborted due to unmount/change
        }
        if (isMountedRef.current) {
          setError(true);
          setLoading(false);
          if (onError) onError(err);
        }
      });

    return () => {
      isMountedRef.current = false;
      controller.abort();
    };
  }, [src, isPrivate]);

  if (error) {
    if (fallback) return fallback;
    return (
      <div className={`flex flex-col items-center justify-center bg-border/10 text-secondary p-4 ${className}`}>
        <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-secondary mb-1">
          <path d="M8 16 L20 8 L32 12 L44 8 L56 16 L52 44 L32 56 L12 44 Z" stroke="currentColor" strokeWidth="2.5" fill="none" />
          <circle cx="32" cy="30" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
        <span className="text-xs font-medium">Image unavailable</span>
      </div>
    );
  }

  if (loading && !blobUrl) {
    return (
      <div className={`flex items-center justify-center bg-border/10 text-secondary animate-pulse ${className}`}>
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <img
      src={blobUrl || src}
      alt={alt}
      className={className}
      onLoad={(e) => {
        if (onLoad) onLoad(e);
      }}
      onError={(e) => {
        if (onError) onError(e);
      }}
      {...props}
    />
  );
}
