import React, { useState, useEffect } from 'react';
import { getAllAvailableWeeks } from '../services/userQuizService';
import { getQuizzesByWeek } from '../services/weekQuizService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './Leaderboard.css';

const Leaderboard = () => {
  const [currentWeek, setCurrentWeek] = useState('');
  const [availableWeeks, setAvailableWeeks] = useState([]);
  const [finishedWeeks, setFinishedWeeks] = useState([]); // Chỉ tuần đã kết thúc
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lấy danh sách tuần đã kết thúc (endTime < now)
  const getFinishedWeeks = async (weeks) => {
    const now = new Date();
    const finished = [];
    
    for (const weekId of weeks) {
      try {
        const weekQuizData = await getQuizzesByWeek(weekId);
        if (weekQuizData.length > 0) {
          const quiz = weekQuizData[0];
          if (quiz.endTime) {
            const endTime = quiz.endTime.toDate ? quiz.endTime.toDate() : new Date(quiz.endTime);
            if (now > endTime) {
              finished.push(weekId);
            }
          }
        }
      } catch (error) {
        console.error(`Error checking week ${weekId}:`, error);
      }
    }
    
    return finished.sort(); // Sắp xếp theo thứ tự tuần
  };

  // Tìm tuần gần nhất đã kết thúc
  const getLatestFinishedWeek = (finishedWeeks) => {
    if (finishedWeeks.length === 0) return null;
    return finishedWeeks[finishedWeeks.length - 1];
  };

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);
        
        const weeks = await getAllAvailableWeeks();
        setAvailableWeeks(weeks);
        
        // Lấy danh sách tuần đã kết thúc
        const finished = await getFinishedWeeks(weeks);
        setFinishedWeeks(finished);
        
        if (finished.length > 0) {
          // Chọn tuần gần nhất đã kết thúc
          const latestFinished = getLatestFinishedWeek(finished);
          setCurrentWeek(latestFinished);
        } else {
          setError('Chưa có tuần nào kết thúc để hiển thị bảng xếp hạng');
        }
        
      } catch (err) {
        console.error('Lỗi khi load dữ liệu ban đầu:', err);
        setError('Có lỗi khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, []);

  // Load dữ liệu bảng xếp hạng khi chọn tuần
  useEffect(() => {
    const loadLeaderboardData = async () => {
      if (!currentWeek) return;

      try {
        setLoading(true);
        
        // Lấy dữ liệu quiz của tuần để tính điểm
        const weekQuizzes = await getQuizzesByWeek(currentWeek);
        if (weekQuizzes.length === 0) {
          setLeaderboardData([]);
          return;
        }

        // Tạo đáp án đúng cho tuần này
        const correctAnswers = {};
        weekQuizzes.forEach(quiz => {
          correctAnswers[`Quiz${quiz.quizNumber}`] = quiz.correctAnswer;
        });

        // Lấy dữ liệu user answers từ Firebase collection users_quiz
        const weekRef = doc(db, 'users_quiz', currentWeek);
        const weekSnap = await getDoc(weekRef);
        
        if (!weekSnap.exists()) {
          setLeaderboardData([]);
          return;
        }

        const weekData = weekSnap.data();
        
        // Lấy thông tin users để có username/displayName
        const usersRef = collection(db, 'users');
        const usersSnap = await getDocs(usersRef);
        const usersData = {};
        
        usersSnap.forEach(doc => {
          const userData = doc.data();
          // Document ID chính là MSSV, userData.name là tên thật
          usersData[doc.id] = userData;
        });

        // Tính điểm cho từng user
        const leaderboard = [];
        
        Object.keys(weekData).forEach(userId => {
          const userAnswers = weekData[userId];
          
          let totalScore = 0;
          let correctCount = 0;
          let totalQuestions = 0;

          // Tính điểm dựa trên quiz number
          Object.keys(correctAnswers).forEach(quizKey => {
            const quizNumber = parseInt(quizKey.replace('Quiz', ''));
            if (userAnswers[quizKey] !== undefined) {
              totalQuestions++;
              if (userAnswers[quizKey] === correctAnswers[quizKey]) {
                totalScore += quizNumber; // Quiz 1 = 1 điểm, Quiz 5 = 5 điểm
                correctCount++;
              }
            }
          });

          // Chỉ thêm user nếu họ đã làm ít nhất 1 quiz
          if (totalQuestions > 0) {
            const userInfo = usersData[userId] || {};
            
            // Lấy thời gian nộp bài từ thoiGian field
            const submissionTime = userAnswers.thoiGian ? 
              (userAnswers.thoiGian.toDate ? userAnswers.thoiGian.toDate() : new Date(userAnswers.thoiGian)) : 
              new Date();
            
            leaderboard.push({
              userId, // MSSV (chính là Document ID trong collection users)
              username: userInfo.name || `User ${userId}`, // Tên thật từ field "name"
              displayName: userInfo.name || `User ${userId}`, // Tên thật
              totalScore,
              correctCount,
              totalQuestions,
              percentage: totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0,
              submissionTime
            });
          }
        });

        // Sắp xếp theo điểm số giảm dần, sau đó theo thời gian nộp bài (ai nộp trước thì xếp cao hơn)
        leaderboard.sort((a, b) => {
          // Sắp xếp theo điểm số trước
          if (b.totalScore !== a.totalScore) {
            return b.totalScore - a.totalScore;
          }
          
          // Nếu điểm bằng nhau, xếp theo thời gian (ai nộp trước thì xếp cao hơn)
          const timeA = a.submissionTime ? new Date(a.submissionTime) : new Date();
          const timeB = b.submissionTime ? new Date(b.submissionTime) : new Date();
          return timeA - timeB; // Thời gian sớm hơn = rank cao hơn
        });

        // Gán rank tuần tự: Top 1, Top 2, Top 3 (mỗi vị trí chỉ có 1 người)
        const rankedLeaderboard = leaderboard.map((user, index) => ({
          ...user,
          rank: index + 1
        }));

        // Chỉ lấy top 3 người đầu tiên
        const top3 = rankedLeaderboard.slice(0, 3);

        setLeaderboardData(top3);
        
      } catch (err) {
        console.error('Lỗi khi load dữ liệu bảng xếp hạng:', err);
        setError('Có lỗi khi tải dữ liệu bảng xếp hạng');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboardData();
  }, [currentWeek]);

  // Lấy icon và màu cho rank
  const getRankInfo = (rank) => {
    switch (rank) {
      case 1:
        return { icon: '🥇', color: '#FFD700', label: 'Top 1', coins: '10 Coins' };
      case 2:
        return { icon: '🥈', color: '#C0C0C0', label: 'Top 2', coins: '6 Coins' };
      case 3:
        return { icon: '🥉', color: '#CD7F32', label: 'Top 3', coins: '3 Coins' };
      default:
        return { icon: '🏆', color: '#667eea', label: `Top ${rank}`, coins: '1 Coin' };
    }
  };

  // Điều hướng tuần (chỉ trong finishedWeeks)
  const navigateWeek = (direction) => {
    const currentIndex = finishedWeeks.indexOf(currentWeek);
    let newIndex;
    
    if (direction === 'prev') {
      newIndex = Math.max(0, currentIndex - 1);
    } else if (direction === 'next') {
      newIndex = Math.min(finishedWeeks.length - 1, currentIndex + 1);
    }
    
    if (newIndex !== undefined && finishedWeeks[newIndex]) {
      setCurrentWeek(finishedWeeks[newIndex]);
    }
  };

  // Xử lý chọn tuần từ select
  const handleWeekSelect = (selectedWeek) => {
    if (finishedWeeks.includes(selectedWeek)) {
      setCurrentWeek(selectedWeek);
    }
  };

  const canGoPrev = finishedWeeks.indexOf(currentWeek) > 0;
  const canGoNext = finishedWeeks.indexOf(currentWeek) < finishedWeeks.length - 1;

  if (loading) {
    return (
      <div className="leaderboard-loading">
        <div className="leaderboard-spinner"></div>
        <p>Đang tải bảng xếp hạng...</p>
      </div>
    );
  }

    return (
      
        <div className="leaderboard-container">
            
      <div className="leaderboard-content">
                {/* Header */}
                {/* Week Selection Section */}
        <div className="leaderboard-week-selection">
          <h3>📅 Chọn tuần xem bảng xếp hạng</h3>
          <div className="leaderboard-week-controls">
            <button 
              onClick={() => navigateWeek('prev')}
              disabled={!canGoPrev}
              className="leaderboard-nav-btn"
            >
              ← Tuần trước
            </button>
            
            <div className="leaderboard-week-selector">
              <label htmlFor="week-select">Tuần:</label>
              <select 
                id="week-select"
                value={currentWeek}
                onChange={(e) => handleWeekSelect(e.target.value)}
                className="leaderboard-week-select"
              >
                {finishedWeeks.length === 0 ? (
                  <option value="">Chưa có tuần nào kết thúc</option>
                ) : (
                  finishedWeeks.map(week => (
                    <option key={week} value={week}>
                      {week.replace('week', 'Tuần ')}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <button 
              onClick={() => navigateWeek('next')}
              disabled={!canGoNext}
              className="leaderboard-nav-btn"
            >
              Tuần sau →
            </button>
          </div>
          
          {currentWeek && (
            <div className="leaderboard-selected-week">
              <strong>Đang xem: Bảng xếp hạng {currentWeek.replace('week', 'Tuần ')}</strong>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="leaderboard-error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>Thử lại</button>
          </div>
        )}
        <div className="leaderboard-header">
          <h1>🏆 Bảng Xếp Hạng</h1>
          <p>Top 3 điểm cao nhất tuần</p>
        </div>

        

        {/* Leaderboard */}
        {!error && (
          <div className="leaderboard-list">
            {leaderboardData.length === 0 ? (
              <div className="leaderboard-empty">
                <h3>🎯 Chưa có dữ liệu</h3>
                <p>Chưa có ai hoàn thành quiz trong tuần này.</p>
              </div>
            ) : (
              <div className="leaderboard-rankings">
                {leaderboardData.map((user, index) => {
                  const rankInfo = getRankInfo(user.rank);
                  
                  return (
                    <div key={`${user.userId}-${index}`} className={`leaderboard-rank-card rank-${user.rank}`}>
                      <div className="leaderboard-rank-info">
                        <div className="leaderboard-rank-icon" style={{ color: rankInfo.color }}>
                          {rankInfo.icon}
                        </div>
                        <div className="leaderboard-rank-details">
                          <div className="leaderboard-rank-label">{rankInfo.label}</div>
                          <div className="leaderboard-rank-reward">🪙 {rankInfo.coins}</div>
                        </div>
                      </div>
                      
                      <div className="leaderboard-user-info">
                        <div className="leaderboard-username">
                          <div className="user-display-name">{user.displayName || user.username}</div>
                          <div className="user-student-id">MSSV: {user.userId}</div>
                        </div>
                        <div className="leaderboard-stats">
                          <span className="leaderboard-score">{user.totalScore} điểm</span>
                          <span className="leaderboard-accuracy">
                            {user.correctCount}/{user.totalQuestions}
                          </span>
                          <span className="leaderboard-time">
                            ⏰ {user.submissionTime.toLocaleString('vi-VN', {
                              day: '2-digit',
                              month: '2-digit', 
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        
      </div>
    </div>
  );
};

export default Leaderboard;