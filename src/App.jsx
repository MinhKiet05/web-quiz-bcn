
import './App.css'
import Header from './components/Header/Header'
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RedirectToHome from './components/RedirectToHome/RedirectToHome'
import Login from './components/Login/Login'
import ToastContainer from './components/Toast/ToastContainer'
import React, { useState, lazy, Suspense, useEffect } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import quizImg from './assets/quiz.webp';
import rankingImg from './assets/ranking.webp';
import checkImg from './assets/check.webp';
// Lazy load các page components
const Upload = lazy(() => import('./pages/UploadQuiz/Upload'))
const QuizzList = lazy(() => import('./pages/QuizList/QuizzList'))
const UserManagement = lazy(() => import('./pages/UserManagement/UserManagement'))
const QuizPlayer = lazy(() => import('./pages/QuizPlayer/QuizPlayer'))
const QuizHistory = lazy(() => import('./pages/QuizHistory/QuizHistory'))
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'))
const UsersQuizByWeek = lazy(() => import('./pages/UsersQuizByWeek/UsersQuizByWeek'))
const Rules = lazy(() => import('./pages/Rules/Rules'))

// Loading spinner component
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '200px',
    flexDirection: 'column'
  }}>
    <FontAwesomeIcon icon={faSpinner} spin style={{ fontSize: '32px', color: '#4FAF9C' }} />
    <p style={{ marginTop: '10px', color: '#666' }}>Đang tải...</p>
  </div>
);

const ProtectedRoute = ({ children, requireAdmin = false, requireEditor = false }) => {
  const { user, isAdmin, hasRole } = useAuth();

  if (!user) {
    return <RedirectToHome 
      message="🔒 Cần đăng nhập"
      reason="Bạn cần đăng nhập để truy cập trang này."
    />;
  }

  if (requireAdmin && !isAdmin()) {
    return <RedirectToHome 
      message="⚠️ Không có quyền truy cập"
      reason="Chỉ admin mới có thể truy cập trang này."
    />;
  }

  if (requireEditor && !hasRole('admin') && !hasRole('editor')) {
    return <RedirectToHome 
      message="⚠️ Không có quyền truy cập"
      reason="Chỉ admin và editor mới có thể truy cập trang này."
    />;
  }

  return children;
};

function AppContent() {
  const { loading } = useAuth();

  // Hiển thị loading khi đang khởi tạo authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        background: '#f5f5f5',
        color: '#555'
      }}>
        <div style={{
          padding: '20px',
          textAlign: 'center',
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        }}>
          <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" style={{ fontSize: '50px'}} />
          <div>Đang khởi tạo ứng dụng...</div>
          <small style={{ opacity: 0.7 }}>Kiểm tra phiên đăng nhập</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <main>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/upload" element={
              <ProtectedRoute requireEditor={true}>
                <Upload />
              </ProtectedRoute>
            } />
            <Route path="/quizzes" element={
              <ProtectedRoute requireEditor={true}>
                <QuizzList />
              </ProtectedRoute>
            } />
            <Route path="/user-management" element={
              <ProtectedRoute requireAdmin={true}>
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/users-quiz-by-week" element={
              <ProtectedRoute requireAdmin={true}>
                <UsersQuizByWeek />
              </ProtectedRoute>
            } />
            <Route path="/my-quizzes" element={
              <ProtectedRoute>
                <QuizHistory />
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            } />
          </Routes>
        </Suspense>
      </main>
      <ToastContainer />
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
  const { user } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const navigate = useNavigate();

  // Check for first-time login and redirect to rules
  useEffect(() => {
    if (user) {
      const hasSeenRules = localStorage.getItem(`hasSeenRules_${user.uid}`);
      
      if (!hasSeenRules) {
        // First time login - redirect to rules page
        localStorage.setItem(`hasSeenRules_${user.uid}`, 'true');
        navigate('/rules');
        return;
      }
    }
  }, [user, navigate]);

  // If user is logged in and has seen rules, show QuizPlayer
  if (user) {
    return <QuizPlayer />;
  }

  // If not logged in, show welcome page
  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          minWidth:'250px',
          background: '#CFCFCF',
          color: '#1e272e !important',
          padding: '20px 24px 20px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0px auto 20px auto',
          lineHeight: 1.6,
          marginTop: '0px'
        }}>
          
          <h1 style={{ margin: '10px 0 16px 0', fontSize: '32px' , color: '#1e272e'}}>
            Quiz Hàng Tuần
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '30px' , color: '#1e272e'}}>
            Hệ thống quiz trực tuyến dành cho Ban Công Nghệ
          </p>
          
          <div>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px' , color: '#1e272e'}}>
              Đăng nhập để tham gia các quiz và hoạt động thú vị!
            </p>
            
            
            {/* Login Button */}
            <button 
              onClick={() => setShowLogin(true)}
              style={{
                background: '#424242',
                color: 'white',
                border: '2px solid #1e272e',
                padding: '12px 32px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#232323';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = '#424242';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
          <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginTop: '24px',
              color: '#1e272e'
            }}>
              Bạn sẽ có thể tham gia quiz hàng tuần và nhận coins thưởng
            </div>
        </div>
              
        {/* Features Preview */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        maxWidth: '800px',
        margin: '40px auto'
      }}>
        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div> <img src={quizImg} alt="" height={'160px'}/></div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Quiz Hàng Tuần</h3>
          <p style={{ color: '#424242', fontSize: '16px' }}>
            5 câu hỏi từ dễ đến khó, cập nhật mỗi tuần
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div> <img src={rankingImg} alt="" height={'160px'}/></div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Xếp Hạng</h3>
          <p style={{ color: '#424242', fontSize: '16px' }}>
            Top 3 cao điểm nhận coins thưởng
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div><img src={checkImg} alt="" height={'160px'}/></div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Theo Dõi</h3>
          <p style={{ color: '#424242', fontSize: '16px' }}>
            Xem lại quiz đã làm và kiểm tra đáp án
          </p>
        </div>
      </div>
      </div>
      
      {/* Login Modal */}
      {showLogin && (
        <Login onClose={() => setShowLogin(false)} />
      )}
    </>
  );
};

export default App
