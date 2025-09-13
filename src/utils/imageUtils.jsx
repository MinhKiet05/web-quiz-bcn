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
    console.error('Image failed to load:', currentUrl, 'Error:', e.type || 'Unknown error');
    
    // Thử URL tiếp theo trong danh sách
    if (currentUrlIndex < alternativeUrls.length - 1) {
      setCurrentUrlIndex(currentUrlIndex + 1);
      setIsLoading(true);
      setHasError(false);
      return;
    }
    
    // Thử fallback nếu có
    if (fallbackSrc && !alternativeUrls.includes(fallbackSrc)) {
      alternativeUrls.push(fallbackSrc);
      setCurrentUrlIndex(alternativeUrls.length - 1);
      setIsLoading(true);
      setHasError(false);
      return;
    }
    
    // Tất cả URL đều thất bại
    console.error('All alternative URLs failed for:', url);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
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
              setCurrentUrlIndex(0);
              setHasError(false);
              setIsLoading(true);
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
