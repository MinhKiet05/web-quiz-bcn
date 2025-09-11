import React, { useState, useEffect } from 'react';
import { getAlternativeUrls } from './imageHelpers.js';

/**
 * Component hiển thị ảnh với xử lý Google Drive links
 */
export const ImageDisplay = ({ 
  url, 
  alt = "Image", 
  className = "", 
  style = {},
  fallbackSrc = "",
  ...props 
}) => {
  const alternativeUrls = getAlternativeUrls(url);
  const [currentUrlIndex, setCurrentUrlIndex] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const currentUrl = alternativeUrls[currentUrlIndex] || '';

  const handleError = (e) => {
    console.error('Image failed to load:', currentUrl, 'Error:', e);
    
    // Thử URL tiếp theo trong danh sách
    if (currentUrlIndex < alternativeUrls.length - 1) {
      console.log('Trying next alternative URL:', alternativeUrls[currentUrlIndex + 1]);
      setCurrentUrlIndex(currentUrlIndex + 1);
      setIsLoading(true);
      return;
    }
    
    // Thử fallback nếu có
    if (fallbackSrc && !alternativeUrls.includes(fallbackSrc)) {
      console.log('Trying fallback image:', fallbackSrc);
      alternativeUrls.push(fallbackSrc);
      setCurrentUrlIndex(alternativeUrls.length - 1);
      setIsLoading(true);
      return;
    }
    
    // Tất cả URL đều thất bại
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    console.log('Image loaded successfully:', currentUrl);
    setHasError(false);
    setIsLoading(false);
  };

  // Reset khi URL thay đổi
  useEffect(() => {
    setCurrentUrlIndex(0);
    setHasError(false);
    setIsLoading(true);
  }, [url]);

  // Show loading state
  if (isLoading && !hasError && currentUrl) {
    return (
      <div 
        className={`image-loading ${className}`} 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e3f2fd',
          color: '#1976d2',
          border: '1px solid #bbdefb',
          minHeight: '100px',
          borderRadius: '8px',
          ...style
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div>📥 Đang tải ảnh...</div>
          <small>Thử URL {currentUrlIndex + 1}/{alternativeUrls.length}</small>
        </div>
        <img
          src={currentUrl}
          alt={alt}
          style={{ display: 'none' }}
          onError={handleError}
          onLoad={handleLoad}
        />
      </div>
    );
  }

  if (hasError || !currentUrl) {
    return (
      <div 
        className={`image-placeholder ${className}`} 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffebee',
          color: '#c62828',
          border: '2px dashed #ffcdd2',
          minHeight: '100px',
          padding: '10px',
          textAlign: 'center',
          borderRadius: '8px',
          ...style
        }}
      >
        <div>
          <div>🖼️ Không thể tải ảnh</div>
          <small style={{ fontSize: '0.75em', marginTop: '5px', display: 'block', opacity: 0.7 }}>
            Đã thử {alternativeUrls.length} URL khác nhau
          </small>
          <small style={{ fontSize: '0.7em', marginTop: '2px', display: 'block', opacity: 0.5, wordBreak: 'break-all' }}>
            {url}
          </small>
        </div>
      </div>
    );
  }

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
