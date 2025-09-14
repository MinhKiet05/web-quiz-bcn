import React, { useState } from 'react';

/**
 * Component đơn giản để hiển thị ảnh Google Drive
 */
const SimpleImageDisplay = ({ url, alt = "Image", style = {} }) => {
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [tryCount, setTryCount] = useState(0);

  // Nhiều cách chuyển đổi Google Drive URL
  const convertGoogleDriveUrl = (originalUrl, attempt = 0) => {
    if (!originalUrl) return '';
    
    // Pattern cho Google Drive sharing URL
    const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
    const match = originalUrl.match(drivePattern);
    
    if (match) {
      const fileId = match[1];
      
      // Thử nhiều format khác nhau
      const formats = [
        `https://drive.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/uc?id=${fileId}`,
        `https://lh3.googleusercontent.com/d/${fileId}`,
        `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
        `https://docs.google.com/uc?export=view&id=${fileId}`,
        `https://drive.google.com/uc?export=download&id=${fileId}`,
        `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
      ];
      
      return formats[attempt] || formats[0];
    }
    
    return originalUrl;
  };

  React.useEffect(() => {
    if (!url) {
      setHasError(true);
      setIsLoading(false);
      return;
    }

    const convertedUrl = convertGoogleDriveUrl(url, tryCount);
    console.log('Try #', tryCount + 1);
    console.log('Original URL:', url);
    console.log('Converted URL:', convertedUrl);
    
    setCurrentUrl(convertedUrl);
    setIsLoading(false);
  }, [url, tryCount]);

  const handleImageError = () => {
    console.error('Image failed to load:', currentUrl);
    if (tryCount < 6) { // Thử tối đa 7 format
      setTryCount(prev => prev + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
    }
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', currentUrl);
    setIsLoading(false);
    setHasError(false);
  };

  if (isLoading) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#f0f0f0',
        textAlign: 'center',
        borderRadius: '8px'
      }}>
        Đang tải ảnh... (Thử lần {tryCount + 1})
      </div>
    );
  }

  if (hasError || !currentUrl) {
    return (
      <div style={{
        padding: '20px',
        backgroundColor: '#ffebee',
        color: '#c62828',
        textAlign: 'center',
        borderRadius: '8px',
        border: '2px dashed #ffcdd2'
      }}>
        <div>Không thể tải ảnh (Đã thử {tryCount + 1} format)</div>
        <div style={{fontSize: '12px', marginTop: '10px', wordBreak: 'break-all'}}>
          URL gốc: {url}
        </div>
        <div style={{fontSize: '12px', marginTop: '5px', wordBreak: 'break-all'}}>
          URL cuối: {currentUrl}
        </div>
        <button 
          onClick={() => {
            setTryCount(0);
            setHasError(false);
            setIsLoading(true);
          }}
          style={{
            marginTop: '10px',
            padding: '5px 10px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={alt}
      style={{ 
        maxWidth: '100%', 
        height: 'auto', 
        borderRadius: '8px',
        ...style 
      }}
      onError={handleImageError}
      onLoad={handleImageLoad}
    />
  );
};

export default SimpleImageDisplay;