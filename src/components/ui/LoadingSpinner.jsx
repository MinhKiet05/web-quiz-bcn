const LoadingSpinner = ({ message = "Đang tải..." }) => {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '60vh',
      flexDirection: 'column',
      background: '#f5f5f5',
      color: '#555'
    }}>
      <div style={{
        padding: '20px',
        textAlign: 'center',
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        minWidth: '200px'
      }}>
        <div style={{ 
          fontSize: '24px', 
          marginBottom: '10px',
          animation: 'spin 1s linear infinite'
        }}>
          ⏳
        </div>
        <div>{message}</div>
        <small style={{ opacity: 0.7 }}>Vui lòng đợi...</small>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;