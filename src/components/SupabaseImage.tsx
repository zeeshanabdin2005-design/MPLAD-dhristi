import React, { useEffect, useState } from 'react';
import { getSignedUrl } from '../services/supabaseStorageService';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

interface SupabaseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string;
  fallbackUrl?: string;
}

export const SupabaseImage: React.FC<SupabaseImageProps> = ({
  storagePath,
  fallbackUrl,
  alt = 'Evidence Image',
  className = '',
  src: propSrc,
  ...props
}) => {
  const initialUrl = (fallbackUrl && fallbackUrl.trim()) || (typeof propSrc === 'string' && propSrc.trim()) || null;
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [loading, setLoading] = useState<boolean>(!initialUrl && Boolean(storagePath));
  const [hasError, setHasError] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    setHasError(false);

    const validFallback = (fallbackUrl && fallbackUrl.trim()) || (typeof propSrc === 'string' && propSrc.trim()) || null;
    if (validFallback) {
      setUrl(validFallback);
    } else {
      setUrl(null);
    }

    if (storagePath) {
      setLoading(true);
      getSignedUrl(storagePath)
        .then(signedUrl => {
          if (isMounted) {
            if (signedUrl && signedUrl.trim()) {
              setUrl(signedUrl.trim());
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (isMounted) {
            setLoading(false);
          }
        });
    } else {
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, [storagePath, fallbackUrl, propSrc]);

  // If no valid URL is available or an error occurred loading the image,
  // do NOT render <img src="" /> as passing empty string to src causes
  // the browser to re-request the page and triggers React warnings.
  if (!url || hasError) {
    return (
      <div
        className={`bg-slate-100 flex flex-col items-center justify-center text-slate-400 select-none ${className}`}
        style={props.style}
        role="img"
        aria-label={alt}
      >
        {loading ? (
          <Loader2 className="h-6 w-6 animate-spin text-slate-400 opacity-60" />
        ) : (
          <ImageIcon className="h-6 w-6 text-slate-400 opacity-40" />
        )}
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
};
