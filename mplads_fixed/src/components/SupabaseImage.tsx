import React, { useEffect, useState } from 'react';
import { getSignedUrl } from '../services/supabaseStorageService';

interface SupabaseImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  storagePath?: string;
  fallbackUrl?: string;
}

export const SupabaseImage: React.FC<SupabaseImageProps> = ({ storagePath, fallbackUrl, ...props }) => {
  const [url, setUrl] = useState<string>(fallbackUrl || '');

  useEffect(() => {
    let isMounted = true;
    if (storagePath) {
      getSignedUrl(storagePath).then(signedUrl => {
        if (isMounted && signedUrl) {
          setUrl(signedUrl);
        }
      });
    }
    return () => { isMounted = false; };
  }, [storagePath]);

  return <img src={url} {...props} />;
};
