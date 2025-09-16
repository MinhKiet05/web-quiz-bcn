import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllAvailableWeeks } from '../../services/userQuizService';
import { getQuizzesByWeek } from '../../services/weekQuizService';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Leaderboard.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';

const Leaderboard = () => {
  const [currentWeek, setCurrentWeek] = useState('');
  const [finishedWeeks, setFinishedWeeks] = useState([]); // Chỉ tuần đã kết thúc
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekDataLoading, setWeekDataLoading] = useState(false);
  const [error, setError] = useState('');
  const [usersCache, setUsersCache] = useState({}); // Cache users data
  const [usersCacheLoaded, setUsersCacheLoaded] = useState(false);

  // Lấy danh sách tuần đã kết thúc (endTime < now) - Parallel loading
  const getFinishedWeeks = async (weeks) => {
    const now = new Date();
    
    // Load tất cả weeks song song
    const weekChecks = weeks.map(async (weekId) => {
      try {
        const weekQuizData = await getQuizzesByWeek(weekId);
        if (weekQuizData.length > 0) {
          const quiz = weekQuizData[0];
          if (quiz.endTime) {
            const endTime = quiz.endTime.toDate ? quiz.endTime.toDate() : new Date(quiz.endTime);
            return now > endTime ? weekId : null;
          }
        }
        return null;
      } catch (error) {
        console.error(`Error checking week ${weekId}:`, error);
        return null;
      }
    });

    const results = await Promise.all(weekChecks);
    return results.filter(weekId => weekId !== null).sort();
  };

  // Load và cache users data
  const loadUsersData = useCallback(async () => {
    if (usersCacheLoaded) return usersCache;

    try {
      const usersRef = collection(db, 'users');
      const usersSnap = await getDocs(usersRef);
      const usersData = {};

      usersSnap.forEach(doc => {
        const userData = doc.data();
        usersData[doc.id] = userData;
      });

      setUsersCache(usersData);
      setUsersCacheLoaded(true);
      return usersData;
    } catch (error) {
      console.error('Error loading users data:', error);
      return {};
    }
  }, [usersCacheLoaded, usersCache]);

  // Load dữ liệu ban đầu
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setLoading(true);

        const weeks = await getAllAvailableWeeks();

        // Lấy danh sách tuần đã kết thúc
        const finished = await getFinishedWeeks(weeks);
        setFinishedWeeks(finished);

        // Chọn tuần mới nhất đã kết thúc
        if (finished.length > 0) {
          const latestFinished = finished[finished.length - 1]; // Tuần đã kết thúc gần nhất
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
        setWeekDataLoading(true);

        // Load song song quiz data và user answers
        const [weekQuizzes, weekRef] = await Promise.all([
          getQuizzesByWeek(currentWeek),
          getDoc(doc(db, 'users_quiz', currentWeek))
        ]);

        if (weekQuizzes.length === 0) {
          setLeaderboardData([]);
          return;
        }

        // Tạo đáp án đúng cho tuần này
        const correctAnswers = {};
        weekQuizzes.forEach(quiz => {
          correctAnswers[`Quiz${quiz.quizNumber}`] = quiz.correctAnswer;
        });

        if (!weekRef.exists()) {
          setLeaderboardData([]);
          return;
        }

        const weekData = weekRef.data();

        // Sử dụng cached users data
        const usersData = await loadUsersData();

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
        setWeekDataLoading(false);
      }
    };

    loadLeaderboardData();
  }, [currentWeek, loadUsersData]);

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

  // Navigation state (cache với useMemo)
  const navigationState = useMemo(() => {
    const currentIndex = finishedWeeks.indexOf(currentWeek);
    return {
      canGoPrev: currentIndex > 0,
      canGoNext: currentIndex < finishedWeeks.length - 1,
      currentIndex
    };
  }, [finishedWeeks, currentWeek]);

  const { canGoPrev, canGoNext } = navigationState;

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

  if (loading) {
    return (
      <div className="leaderboard-loading">
              <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" style={{fontSize: '50px', color: 'rgb(222,226,230)'}}/>
              <p>Đang tải dữ liệu quiz...</p>
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
                      {week.replace('week', '')}
                    </option>
                  ))
                )}
              </select>
            </div>
            <div className="leaderboard-week-nav-buttons">
              <button
              onClick={() => navigateWeek('prev')}
              disabled={!canGoPrev}
              className="leaderboard-nav-btn"
            >
              ← Trước
              </button>
              <button
              onClick={() => navigateWeek('next')}
              disabled={!canGoNext}
              className="leaderboard-nav-btn"
            >
              Sau → 
            </button>
            </div>
            



            
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
            {weekDataLoading ? (
              <div className="leaderboard-loading">
                <FontAwesomeIcon icon={faSpinner} spin className="loading-icon" />
                <p>Đang tải bảng xếp hạng...</p>
              </div>
            ) : leaderboardData.length === 0 ? (
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