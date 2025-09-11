
import './App.css'
import Header from './public/Header.jsx'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthDemo from './components/AuthDemo/AuthDemo'
import Upload from './pages/Upload'
import QuizzList from './pages/QuizzList'

// Import các page khác khi tạo
// import Dashboard from './pages/Dashboard'
// import MyQuizzes from './pages/MyQuizzes'
// import Quizzes from './pages/Quizzes'
// import News from './pages/News'

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { user, isAdmin } = useAuth();
  
  if (!user) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
      <h2>🔒 Vui lòng đăng nhập</h2>
      <p>Bạn cần đăng nhập để truy cập trang này.</p>
    </div>;
  }
  
  if (requireAdmin && !isAdmin()) {
    return <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
      <h2>⚠️ Không có quyền truy cập</h2>
      <p>Chỉ admin mới có thể truy cập trang này.</p>
    </div>;
  }
  
  return children;
};

function AppContent() {
  return (
    <>
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload" element={
            <ProtectedRoute requireAdmin={true}>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/quizz-list" element={<QuizzList />} />
          <Route path="/quizzes" element={<QuizzList />} />
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-quizzes" element={
            <ProtectedRoute>
              <MyQuizzes />
            </ProtectedRoute>
          } />
          <Route path="/news" element={<News />} />
        </Routes>
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}

// Temporary components cho các route chưa có
const Home = () => {
  const { user, isAdmin } = useAuth();
  
  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🏠 Trang chủ</h1>
      <p>Chào mừng đến với Quiz App!</p>
      
      {user ? (
        <div style={{ 
          background: '#e8f5e8', 
          padding: '20px', 
          borderRadius: '8px', 
          margin: '20px auto', 
          maxWidth: '400px',
          color: '#2e7d32'
        }}>
          <h3>� Xin chào, {user.name}!</h3>
          <p>Bạn đã đăng nhập thành công</p>
          {isAdmin() && <p>🔑 <strong>Bạn có quyền Admin</strong></p>}
        </div>
      ) : (
        <div style={{ 
          background: '#fff3e0', 
          padding: '20px', 
          borderRadius: '8px', 
          margin: '20px auto', 
          maxWidth: '400px',
          color: '#ef6c00'
        }}>
          <p>Hãy đăng nhập để trải nghiệm đầy đủ tính năng!</p>
        </div>
      )}
      
      <AuthDemo />
    </div>
  );
};

const Dashboard = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>� Bảng điều khiển</h1>
    <p>Quản lý quiz và xem thống kê</p>
  </div>
);

const MyQuizzes = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>� Các quiz tôi tham gia</h1>
    <p>Xem lại các quiz đã làm</p>
  </div>
);

const News = () => (
  <div style={{ padding: '40px', textAlign: 'center' }}>
    <h1>📰 Tin tức và thông báo quiz</h1>
    <p>Cập nhật mới nhất về quiz</p>
  </div>
);

export default App
