
import './App.css'
import Header from './components/Header/Header'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import RedirectToHome from './components/RedirectToHome/RedirectToHome'
import Login from './components/Login/Login'
import ToastContainer from './components/Toast/ToastContainer'
import { useState, lazy } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

// Lazy load các page components
const Upload = lazy(() => import('./pages/UploadQuiz/Upload'))
const QuizzList = lazy(() => import('./pages/QuizList/QuizzList'))
const UserManagement = lazy(() => import('./pages/UserManagement/UserManagement'))
const QuizPlayer = lazy(() => import('./pages/QuizPlayer/QuizPlayer'))
const QuizHistory = lazy(() => import('./pages/QuizHistory/QuizHistory'))
const Leaderboard = lazy(() => import('./pages/Leaderboard/Leaderboard'))
const UsersQuizByWeek = lazy(() => import('./pages/UsersQuizByWeek/UsersQuizByWeek'))

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
          
          {/* Catch-all route for 404 errors */}
          
        </Routes>
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

  // If user is logged in, show QuizPlayer
  if (user) {
    return <QuizPlayer />;
  }

  // If not logged in, show welcome page
  return (
    <>
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          minWidth:'250px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '20px 24px 20px 24px',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
          textAlign: 'center',
          maxWidth: '600px',
          margin: '0px auto 20px auto',
          lineHeight: 1.6,
          marginTop: '0px'
        }}>
          
          <h1 style={{ margin: '-10px 0 16px 0', fontSize: '32px' }}>
            Quiz Hàng Tuần
          </h1>
          <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '30px' }}>
            Hệ thống quiz trực tuyến dành cho Ban Công Nghệ
          </p>
          
          <div>
            <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '20px' }}>
              Đăng nhập để tham gia các quiz và hoạt động thú vị!
            </p>
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
              marginBottom: '24px'
            }}>
              Bạn sẽ có thể tham gia quiz hàng tuần và nhận coins thưởng
            </div>
            
            {/* Login Button */}
            <button 
              onClick={() => setShowLogin(true)}
              style={{
                background: 'rgba(255,255,255,0.2)',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.3)',
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
                e.target.style.background = 'rgba(255,255,255,0.3)';
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'rgba(255,255,255,0.2)';
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)';
              }}
            >
              Đăng nhập ngay
            </button>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📝</div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Quiz Hàng Tuần</h3>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Xếp Hạng</h3>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
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
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <h3 style={{ color: '#2c3e50', marginBottom: '8px' }}>Theo Dõi</h3>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
            Xem lại quiz đã làm và tiến độ
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

const Rules = () => {
  const { user } = useAuth();

  return (
    <div style={{ padding: '0px', textAlign: 'center' }}>
      {!user && (
        <div style={{
          background: '#fff3e0',
          padding: '20px',
          borderRadius: '8px',
          margin: '0px auto 20px auto',
          maxWidth: '400px',
          color: '#ef6c00'
        }}>
          <p>Hãy đăng nhập để trải nghiệm đầy đủ tính năng!</p>
        </div>
      )}
      
      <div style={{
        background: 'white',
        color: 'black',
        padding: '24px',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'left',
        maxWidth: '700px',
        margin: '0px auto',
        lineHeight: 1.6
      }}>
        <h2 style={{ textAlign: 'center', marginBottom: '16px' ,marginTop: '12px'}}>
          {user ? `Xin chào ${user.name}` : '📋 Thể lệ Quiz Hàng Tuần'}
        </h2>
        
        <p>
          Ngoài những buổi <b>hướng dẫn C</b> do <b>Ban Công Nghệ</b> tổ chức,
          chúng mình sẽ có thêm một hoạt động thú vị giúp các bạn củng cố kiến thức C:
        </p>
        <p style={{ textAlign: 'center', fontSize: '18px', fontWeight: '600', margin: '12px 0' }}>
          Tham gia Quiz Hàng Tuần
        </p>

        <h3>Thể lệ</h3>
        <ul>
          <li>Mỗi tuần có <b>5 câu quiz</b> (từ dễ → khó).</li>
          <li>Câu 1 → 4: <b>Trắc nghiệm</b>.</li>
          <li>Câu 5: <b>Mức khó nhất</b>, có thể là trắc nghiệm hoặc điền đáp án.</li>
        </ul>

        <h3>Cách tính điểm</h3>
        <ul>
          <li>Mỗi câu đúng sẽ được điểm tương ứng
            (VD: Quiz 1 = 1 điểm, Quiz 5 = 5 điểm).</li>
          <li><b>Tổng điểm</b> các câu = điểm tuần của bạn.</li>
          <li><b>Thứ 2 hàng tuần</b>: Công bố đáp án + Bảng xếp hạng.</li>
        </ul>

        <h3>Phần thưởng</h3>
        <p>Ban Công Nghệ sẽ tuyên dương <b>Top 3 bạn cao điểm nhất tuần</b>:</p>
        <ul>
          <li>🥇 Top 1: <b>10 Coins</b></li>
          <li>🥈 Top 2: <b>6 Coins</b></li>
          <li>🥉 Top 3: <b>3 Coins</b></li>
        </ul>

        <h3>Lưu ý</h3>
        <ul>
          <li>Mỗi tuần chỉ có duy nhất <b>1 Top 1, 1 Top 2, 1 Top 3</b>.</li>
          <li>Nếu có nhiều bạn bằng điểm → <b>xét theo thời gian nộp</b>: ai nộp sớm hơn sẽ được xếp hạng cao hơn.</li>
        </ul>
        <p style={{ marginTop: '12px' }}>
          Khi vào Top, các bạn nhắn <b>Tường Vân (khóa bạc)</b> để nhận thưởng nha ✨
        </p>

        {!user && (
          <div style={{ textAlign: 'center', padding: '20px', marginTop: '20px', borderTop: '1px solid #444' }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>
              Đăng nhập để tham gia các quiz và hoạt động thú vị!
            </p>
            <p style={{ fontSize: '14px', opacity: 0.8 }}>
              Bạn sẽ có thể tham gia quiz hàng tuần và nhận coins thưởng
            </p>
          </div>
        )}
      </div>
    </div>
  );
};


const MyQuizzes = () => {
  // Redirect to QuizHistory component
  return <QuizHistory />;
};


export default App
