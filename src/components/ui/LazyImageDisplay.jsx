import React, { useState, useEffect, useRef } from 'react';
import { getAlternativeUrls } from '../utils/imageHelpers.js';

/**
 * Enhanced ImageDisplay component với lazy loading và Intersection Observer
 */
export const LazyImageDisplay = ({ 
  url, 
  alt = "Image", 
  className = "", 
  style = {},
  fallbackSrc = "",
  silentMode = true,
  threshold = 0.1,
  rootMargin = "50px",
  ...props 
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [alternativeUrls, setAlternativeUrls] = useState([]);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer setup
  useEffect(() => {
    const imgElement = imgRef.current;
    if (!imgElement) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        threshold,
        rootMargin
      }
    );

    observerRef.current.observe(imgElement);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin]);

  // Load image when in view
  useEffect(() => {
    if (!isInView || !url) return;

    let urls = getAlternativeUrls(url);
    if (fallbackSrc && !urls.includes(fallbackSrc)) {
      urls.push(fallbackSrc);
    }
    
    setAlternativeUrls(urls);
    setIsLoading(true);
    setHasError(false);

    // Parallel loading strategy
    let resolved = false;

    const testImage = (testUrl) => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          if (!resolved) {
            resolved = true;
            setCurrentUrl(testUrl);
            setIsLoading(false);
            setHasError(false);
            setIsImageLoaded(true);
          }
          resolve(testUrl);
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load: ${testUrl}`));
        };
        
        img.src = testUrl;
      });
    };

    const tryUrls = async () => {
      try {
        await Promise.any(urls.map(testImage));
      } catch (allErrors) {
        if (!resolved) {
          if (!silentMode) {
            console.error('All image URLs failed to load:', allErrors);
          }
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    tryUrls();

    return () => {
      resolved = true;
    };
  }, [isInView, url, fallbackSrc, silentMode]);

  const placeholderStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    color: '#999',
    minHeight: '200px',
    border: '1px dashed #ddd',
    borderRadius: '4px',
    ...style
  };

  return (
    <div ref={imgRef} style={{ position: 'relative' }}>
      {/* Placeholder khi chưa vào viewport hoặc đang loading */}
      {(!isInView || isLoading || hasError) && (
        <div style={placeholderStyle} className={className}>
          {hasError ? (
            <div style={{ textAlign: 'center' }}>
              <div>⚠️ Không thể tải ảnh</div>
              {!silentMode && (
                <small style={{ marginTop: '8px', opacity: 0.7 }}>
                  Đã thử {alternativeUrls.length} URL
                </small>
              )}
            </div>
          ) : !isInView ? (
            '📷 Sẵn sàng tải'
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div>⏳ Đang tải ảnh...</div>
              <small style={{ marginTop: '8px', opacity: 0.7 }}>
                Thử {alternativeUrls.length} URL
              </small>
            </div>
          )}
        </div>
      )}
      
      {/* Image thực sự */}
      {currentUrl && isImageLoaded && (
        <img
          src={currentUrl}
          alt={alt}
          className={className}
          style={{
            ...style,
            opacity: isImageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease-in-out'
          }}
          {...props}
        />
      )}
    </div>
  );
};

export default LazyImageDisplay;