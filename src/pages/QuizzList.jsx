import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { updateWeekTimes } from '../services/weekQuizService.js';
import { ImageDisplay } from '../utils/imageUtils.jsx';
import './QuizzList.css';

// Mock data for testing with correct structure
const mockData = [
  {
    id: 'week1',
    startTime: new Date('2025-09-08T00:00:00+07:00'),
    endTime: new Date('2025-09-14T23:59:59+07:00'),
    Quiz1: {
      dapAnDung: 'C',
      giaiThich: 'Test explanation for Quiz1',
      link: 'https://drive.google.com/file/d/1WaDUnwIcU9g4NBA7ePsoG0US_d2bzCPv',
      soDapAn: ['A', 'B', 'C', 'D']
    },
    Quiz2: {
      dapAnDung: 'B',
      giaiThich: 'Test explanation for Quiz2',
      link: 'https://drive.google.com/file/d/1hkaW1QUFV0mLbP6F1BF_zCNv4kOD78Nt',
      soDapAn: ['A', 'B', 'C', 'D', 'E']
    }
  },
  {
    id: 'week2',
    startTime: new Date('2025-09-15T00:00:00+07:00'),
    endTime: new Date('2025-09-21T23:59:59+07:00'),
    Quiz1: {
      dapAnDung: 'C',
      giaiThich: 'float chỉ chính xác ~6-7 chữ số thập phân. printf("%f") mặc định in 6 số sau dấu phẩy. 0.123456789 bị làm tròn thành 0.123457.',
      link: 'https://drive.google.com/file/d/1ho6-dPXdaikhD_JkyFxd_jNBYXGLMiYx',
      soDapAn: ['A', 'B', 'C', 'D', 'E']
    }
  }
];

const QuizzList = () => {
  const [allWeeksData, setAllWeeksData] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingDocument, setEditingDocument] = useState(false);

  // Get current week data
  const currentWeekData = allWeeksData[currentWeekIndex] || {};
  const quizKeys = Object.keys(currentWeekData).filter(key => key.startsWith('Quiz'));

  // Fetch all weeks data from Firebase
  useEffect(() => {
    const fetchAllWeeks = async () => {
      try {
        setLoading(true);
        // Try "Quiz" first (uppercase), then "quiz" (lowercase)
        let querySnapshot;
        try {
          querySnapshot = await getDocs(collection(db, 'Quiz'));
          console.log('Fetched from "Quiz" collection:', querySnapshot.size, 'documents');
        } catch (fetchError) {
          console.log('Failed to fetch from "Quiz", trying "quiz":', fetchError.message);
          querySnapshot = await getDocs(collection(db, 'quiz'));
          console.log('Fetched from "quiz" collection:', querySnapshot.size, 'documents');
        }
        
        const weeksData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          console.log('Document:', doc.id, 'Data:', data);
          
          // Convert Firestore timestamps to Date objects if they exist at document level
          if (data.startTime && typeof data.startTime.toDate === 'function') {
            data.startTime = data.startTime.toDate();
          }
          if (data.endTime && typeof data.endTime.toDate === 'function') {
            data.endTime = data.endTime.toDate();
          }
          
          // No need to check nested timestamps since startTime/endTime are at document level
          // Quiz1, Quiz2, etc. contain: dapAnDung, giaiThich, link, soDapAn
          
          weeksData.push({ id: doc.id, ...data });
        });
        
        console.log('Processed weeks data:', weeksData);
        
        // Sort weeks by id (week1, week2, etc.)
        weeksData.sort((a, b) => {
          const aNum = parseInt(a.id.replace('week', ''));
          const bNum = parseInt(b.id.replace('week', ''));
          return aNum - bNum;
        });
        
        console.log('Final processed weeks data:', weeksData);
        
        // Debug: log structure of first week if available
        if (weeksData.length > 0) {
          console.log('Sample week structure:', JSON.stringify(weeksData[0], null, 2));
          const firstWeek = weeksData[0];
          const quizKeys = Object.keys(firstWeek).filter(key => key.startsWith('Quiz'));
          console.log('Found quiz keys:', quizKeys);
          if (quizKeys.length > 0) {
            console.log('Sample quiz structure:', JSON.stringify(firstWeek[quizKeys[0]], null, 2));
          }
        }
        
        // If no weeks data found, use mock data for testing
        if (weeksData.length === 0) {
          console.log('No weeks data found in Firebase, using mock data for testing');
          setAllWeeksData(mockData);
        } else {
          setAllWeeksData(weeksData);
        }
      } catch (error) {
        console.error('Error fetching weeks data:', error);
        // Use mock data on error
        console.log('Error occurred, falling back to mock data');
        setAllWeeksData(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWeeks();
  }, []);

  const toggleExpand = (quizKey) => {
    setExpandedQuiz(expandedQuiz === quizKey ? null : quizKey);
  };

  const handleEditQuiz = (quizKey) => {
    setEditingQuiz(quizKey);
  };

  const handleSaveQuiz = (quizKey, updatedQuiz) => {
    setAllWeeksData(prev => {
      const newData = [...prev];
      newData[currentWeekIndex] = {
        ...newData[currentWeekIndex],
        [quizKey]: updatedQuiz
      };
      return newData;
    });
    setEditingQuiz(null);
  };

  const handleEditDocument = () => {
    setEditingDocument(true);
  };

  const handleSaveDocument = async (updatedTimes) => {
    try {
      const currentWeek = allWeeksData[currentWeekIndex];
      if (currentWeek && currentWeek.id) {
        // Update in Firebase
        await updateWeekTimes(
          currentWeek.id, 
          new Date(updatedTimes.startTime),
          new Date(updatedTimes.endTime)
        );
      }
      
      // Update local state
      setAllWeeksData(prev => {
        const newData = [...prev];
        newData[currentWeekIndex] = {
          ...newData[currentWeekIndex],
          startTime: new Date(updatedTimes.startTime),
          endTime: new Date(updatedTimes.endTime)
        };
        return newData;
      });
      setEditingDocument(false);
    } catch (error) {
      console.error('Error updating document times:', error);
      alert('Lỗi khi cập nhật thời gian: ' + error.message);
    }
  };

  const formatDateTime = (date) => {
    return date.toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="quizz-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Đang tải danh sách quiz...</p>
        </div>
      </div>
    );
  }

  if (allWeeksData.length === 0) {
    return (
      <div className="quizz-container">
        <div className="empty-state">
          <h2>📭 Không có dữ liệu quiz</h2>
          <p>Hiện tại chưa có document nào trong Firebase.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quizz-container">
      <header className="quizz-header">
        <h1>📚 Document {currentWeekData.id || 'Loading...'} - Quiz List</h1>
        
        {/* Week Navigation */}
        {allWeeksData.length > 1 && (
          <div className="week-navigation">
            <button 
              onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
              disabled={currentWeekIndex === 0}
              className="nav-btn prev-btn"
            >
              ← Previous Week
            </button>
            <span className="week-indicator">
              Week {currentWeekIndex + 1} of {allWeeksData.length}
            </span>
            <button 
              onClick={() => setCurrentWeekIndex(Math.min(allWeeksData.length - 1, currentWeekIndex + 1))}
              disabled={currentWeekIndex === allWeeksData.length - 1}
              className="nav-btn next-btn"
            >
              Next Week →
            </button>
          </div>
        )}

        <div className="document-info">
          <p><strong>Document ID:</strong> {currentWeekData.id || 'N/A'}</p>
          <p><strong>Tổng quiz:</strong> {quizKeys.length}</p>
          <p><strong>Thời gian bắt đầu:</strong> {currentWeekData.startTime ? formatDateTime(currentWeekData.startTime) : 'N/A'}</p>
          <p><strong>Thời gian kết thúc:</strong> {currentWeekData.endTime ? formatDateTime(currentWeekData.endTime) : 'N/A'}</p>
          <button onClick={handleEditDocument} className="edit-document-btn">
            ✏️ Chỉnh sửa thời gian
          </button>
        </div>
      </header>

      <div className="quizz-grid">
        {quizKeys.map((quizKey) => {
          const quiz = currentWeekData[quizKey];
          const isExpanded = expandedQuiz === quizKey;
          const isEditing = editingQuiz === quizKey;
          
          return (
            <div key={quizKey} className="quiz-card">
              <div className="quiz-header">
                <h3>📝 {quizKey}</h3>
                <span className="answer-count">{quiz.soDapAn.length} đáp án</span>
              </div>
              
              <div className="quiz-info">
                <p><strong>Đáp án đúng:</strong> <span className="correct-answer">{quiz.dapAnDung}</span></p>
                <p><strong>Số đáp án:</strong> {quiz.soDapAn.length} ({quiz.soDapAn.join(', ')})</p>
                <p><strong>Link:</strong> 
                  <a href={quiz.link} target="_blank" rel="noopener noreferrer" className="quiz-link">
                    📎 Xem file
                  </a>
                </p>
              </div>

              <div className="quiz-actions">
                <button 
                  onClick={() => toggleExpand(quizKey)}
                  className="expand-btn"
                >
                  {isExpanded ? '🔼 Thu gọn' : '🔽 Xem chi tiết'}
                </button>
                <button 
                  onClick={() => handleEditQuiz(quizKey)}
                  className="edit-btn"
                >
                  ✏️ Chỉnh sửa
                </button>
              </div>

              {isExpanded && (
                <div className="quiz-details">
                  <h4>📋 Chi tiết {quizKey}:</h4>
                  
                  <div className="quiz-detail-content">
                    <div className="quiz-image-section">
                      <p><strong>Hình ảnh câu hỏi:</strong></p>
                      <ImageDisplay 
                        url={quiz.link} 
                        alt={`${quizKey} image`}
                        className="quiz-image"
                      />
                    </div>
                    
                    <div className="quiz-explanation">
                      <p><strong>Giải thích:</strong></p>
                      <div className="explanation-text">{quiz.giaiThich}</div>
                    </div>
                    
                    <div className="answer-choices">
                      <p><strong>Các lựa chọn đáp án:</strong></p>
                      <div className="choices-grid">
                        {quiz.soDapAn.map((answer) => (
                          <span 
                            key={answer} 
                            className={`choice-item ${answer === quiz.dapAnDung ? 'correct' : ''}`}
                          >
                            {answer}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {isEditing && (
                <QuizEditForm 
                  quiz={quiz}
                  quizKey={quizKey}
                  onSave={handleSaveQuiz}
                  onCancel={() => setEditingQuiz(null)}
                />
              )}
            </div>
          );
        })}
      </div>

      {editingDocument && (
        <DocumentEditModal 
          startTime={currentWeekData.startTime}
          endTime={currentWeekData.endTime}
          onSave={handleSaveDocument}
          onCancel={() => setEditingDocument(false)}
        />
      )}
    </div>
  );
};

// Component để chỉnh sửa quiz
const QuizEditForm = ({ quiz, quizKey, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    dapAnDung: quiz.dapAnDung,
    giaiThich: quiz.giaiThich,
    link: quiz.link,
    soDapAn: quiz.soDapAn.join(', ')
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedQuiz = {
      ...quiz,
      dapAnDung: formData.dapAnDung,
      giaiThich: formData.giaiThich,
      link: formData.link,
      soDapAn: formData.soDapAn.split(',').map(s => s.trim()).filter(s => s)
    };
    onSave(quizKey, updatedQuiz);
  };

  return (
    <div className="edit-form-overlay">
      <div className="edit-form">
        <h4>✏️ Chỉnh sửa {quizKey}</h4>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Đáp án đúng:</label>
            <input
              type="text"
              value={formData.dapAnDung}
              onChange={(e) => setFormData(prev => ({ ...prev, dapAnDung: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Giải thích:</label>
            <textarea
              value={formData.giaiThich}
              onChange={(e) => setFormData(prev => ({ ...prev, giaiThich: e.target.value }))}
              rows={4}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Link:</label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Số đáp án (phân cách bằng dấu phẩy):</label>
            <input
              type="text"
              value={formData.soDapAn}
              onChange={(e) => setFormData(prev => ({ ...prev, soDapAn: e.target.value }))}
              placeholder="A, B, C, D"
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">💾 Lưu</button>
            <button type="button" onClick={onCancel} className="cancel-btn">❌ Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Component để chỉnh sửa thời gian document
const DocumentEditModal = ({ startTime, endTime, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    startTime: startTime.toISOString().slice(0, 16),
    endTime: endTime.toISOString().slice(0, 16)
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      startTime: formData.startTime,
      endTime: formData.endTime
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div className="modal-header">
          <h3>⏰ Chỉnh sửa thời gian Document</h3>
          <button onClick={onCancel} className="close-btn">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="document-edit-form">
          <div className="form-group">
            <label>Thời gian bắt đầu:</label>
            <input
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Thời gian kết thúc:</label>
            <input
              type="datetime-local"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              required
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-btn">💾 Lưu thay đổi</button>
            <button type="button" onClick={onCancel} className="cancel-btn">❌ Hủy</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizzList;
