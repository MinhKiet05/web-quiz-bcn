import React, { useState, useEffect } from 'react';

const ImageDebugTest = () => {
  const testUrl = "https://drive.google.com/file/d/1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv";
  const [results, setResults] = useState([]);

  const testUrls = [
    // Original URL
    testUrl,
    // Standard Google Drive direct formats
    "https://drive.google.com/uc?export=view&id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv",
    "https://drive.google.com/uc?id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv",
    "https://lh3.googleusercontent.com/d/1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv",
    "https://drive.google.com/thumbnail?id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv&sz=w1000",
    "https://docs.google.com/uc?export=view&id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv",
    // With view suffix
    testUrl + "/view?usp=sharing",
    // Alternative formats
    "https://drive.google.com/uc?export=download&id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv",
    "https://drive.google.com/thumbnail?id=1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv&sz=w800"
  ];

  const testImage = (url, index) => {
    return new Promise((resolve) => {
      const img = new Image();
      const startTime = Date.now();
      
      img.onload = () => {
        const loadTime = Date.now() - startTime;
        resolve({
          index,
          url,
          status: 'SUCCESS',
          loadTime,
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = (error) => {
        const loadTime = Date.now() - startTime;
        resolve({
          index,
          url,
          status: 'FAILED',
          loadTime,
          error: error.message || 'Load failed'
        });
      };
      
      // Timeout after 10 seconds
      setTimeout(() => {
        resolve({
          index,
          url,
          status: 'TIMEOUT',
          loadTime: 10000
        });
      }, 10000);
      
      img.src = url;
    });
  };

  useEffect(() => {
    const runTests = async () => {
      console.log('🔍 Starting image URL tests...');
      setResults([]);
      
      const promises = testUrls.map((url, index) => testImage(url, index));
      
      // Test all URLs in parallel
      const allResults = await Promise.all(promises);
      
      console.log('📊 Test Results:', allResults);
      setResults(allResults);
    };

    runTests();
  }, [testUrl]);

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <h2>🔬 Google Drive Image URL Debug Test</h2>
      
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5',
        borderRadius: '8px',
        wordBreak: 'break-all'
      }}>
        <strong>Original URL:</strong><br/>
        {testUrl}
      </div>

      <div style={{ display: 'grid', gap: '20px' }}>
        {results.map((result, index) => (
          <div 
            key={index}
            style={{
              border: `2px solid ${result.status === 'SUCCESS' ? '#4CAF50' : result.status === 'FAILED' ? '#f44336' : '#ff9800'}`,
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: result.status === 'SUCCESS' ? '#e8f5e8' : result.status === 'FAILED' ? '#ffebee' : '#fff3e0'
            }}
          >
            <div style={{ marginBottom: '10px' }}>
              <strong>Test #{index + 1}: </strong>
              <span style={{ 
                color: result.status === 'SUCCESS' ? '#4CAF50' : result.status === 'FAILED' ? '#f44336' : '#ff9800',
                fontWeight: 'bold'
              }}>
                {result.status}
              </span>
              {result.status === 'SUCCESS' && (
                <span style={{ marginLeft: '10px', color: '#666' }}>
                  ({result.width}x{result.height}px, {result.loadTime}ms)
                </span>
              )}
            </div>
            
            <div style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '10px',
              wordBreak: 'break-all'
            }}>
              {result.url}
            </div>
            
            {result.status === 'SUCCESS' && (
              <div style={{ marginTop: '10px' }}>
                <img 
                  src={result.url} 
                  alt={`Test ${index + 1}`}
                  style={{ 
                    maxWidth: '300px', 
                    maxHeight: '200px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                />
              </div>
            )}
            
            {result.status === 'FAILED' && (
              <div style={{ color: '#f44336', fontSize: '12px' }}>
                Error: {result.error}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
          <div>Testing URLs...</div>
        </div>
      )}
    </div>
  );
};

export default ImageDebugTest;