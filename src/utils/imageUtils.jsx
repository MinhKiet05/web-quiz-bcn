import React, { useState, useEffect } from 'react';
import { getAlternativeUrls } from './imageHelpers.js';

/**
 * Component hiển thị ảnh với xử lý Google Drive links - Tối ưu tốc độ tải
 */
export const ImageDisplay = ({ 
  url, 
  alt = "Image", 
  className = "", 
  style = {},
  fallbackSrc = "",
  silentMode = true,
  ...props 
}) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [alternativeUrls, setAlternativeUrls] = useState([]);

  useEffect(() => {
    if (!url) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    let urls = getAlternativeUrls(url);
    if (fallbackSrc && !urls.includes(fallbackSrc)) {
      urls.push(fallbackSrc);
    }
    
    setAlternativeUrls(urls);
    setIsLoading(true);
    setHasError(false);

    // Parallel loading strategy - test all URLs simultaneously to find fastest working one
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
          }
          resolve({ url: testUrl, success: true });
        };

        img.onerror = () => {
          if (!silentMode) {
            console.warn('Image failed to load:', testUrl);
          }
          reject({ url: testUrl, success: false });
        };

        // Timeout to prevent hanging
        setTimeout(() => {
          if (!resolved) {
            reject({ url: testUrl, success: false, timeout: true });
          }
        }, 6000);

        img.src = testUrl;
      });
    };

    // Start parallel loading for all URLs
    const imagePromises = urls.map(testUrl => testImage(testUrl));

    // Use Promise.any to get the first successful load
    Promise.any(imagePromises)
      .then((result) => {
        if (!silentMode) {
          console.log('Image loaded successfully:', result.url);
        }
      })
      .catch(() => {
        // All URLs failed
        if (!resolved) {
          setIsLoading(false);
          setHasError(true);
        }
      });

    return () => {
      resolved = true;
    };

  }, [url, fallbackSrc, silentMode]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };
  // Loading state - much faster with parallel loading
  if (isLoading && !hasError) {
    return (
      <div 
        className={`image-loading ${className}`} 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          border: '1px solid #bbdefb',
          minHeight: '100px',
          padding: '15px',
          borderRadius: '8px',
          ...style
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡</div>
          <div>Đang tải ảnh...</div>
          <small>Tìm nguồn tốt nhất...</small>
        </div>
      </div>
    );
  }

  // Error state
  if (hasError || !currentUrl) {
    return (
      <div 
        className={`image-placeholder ${className}`} 
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffebee',
          color: '#c62828',
          border: '2px dashed #ffcdd2',
          minHeight: '100px',
          padding: '15px',
          textAlign: 'center',
          borderRadius: '8px',
          ...style
        }}
      >
        <div>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>🖼️</div>
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Không thể tải ảnh</div>
          <small style={{ fontSize: '0.75em', marginBottom: '8px', display: 'block', opacity: 0.7 }}>
            Đã thử {alternativeUrls.length} URL khác nhau
          </small>
          <button 
            onClick={() => {
              setIsLoading(true);
              setHasError(false);
              // Force re-render to trigger useEffect
              setAlternativeUrls([...alternativeUrls]);
            }}
            style={{
              padding: '6px 12px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.75em',
              marginBottom: '8px'
            }}
          >
            🔄 Thử lại
          </button>
          <details style={{ marginTop: '5px' }}>
            <summary style={{ cursor: 'pointer', fontSize: '0.7em', opacity: 0.6 }}>
              Chi tiết lỗi
            </summary>
            <div style={{ fontSize: '0.6em', marginTop: '5px', opacity: 0.5, wordBreak: 'break-all', maxWidth: '200px' }}>
              <strong>URL gốc:</strong><br/>
              {url}<br/><br/>
              <strong>URLs đã thử:</strong><br/>
              {alternativeUrls.map((u, i) => (
                <div key={i}>{i + 1}. {u}</div>
              ))}
            </div>
          </details>
        </div>
      </div>
    );
  }

  // Success state - image loaded
  return (
    <img
      src={currentUrl}
      alt={alt}
      className={className}
      style={{ 
        maxWidth: '100%', 
        height: 'auto', 
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        ...style 
      }}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
};

export default ImageDisplay;
