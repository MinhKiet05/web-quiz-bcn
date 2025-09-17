import React, { useState, useEffect } from 'react';
import { updateWeekTimes, updateQuizInWeek } from '../../services/weekQuizService.js';
import { getAllWeeksWithQuizData } from '../../services/weekQuizService.js';
import { showToast } from '../../utils/toastUtils.js';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUtils.js';
import './QuizzList.css';

const QuizzList = () => {
  const [allWeeksData, setAllWeeksData] = useState([]);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);
  const [editingDocument, setEditingDocument] = useState(false);

  // Get current week data
  const currentWeekData = allWeeksData[currentWeekIndex] || {};
  // Sort quiz keys in order: Quiz1, Quiz2, Quiz3, Quiz4, Quiz5
  const quizKeys = Object.keys(currentWeekData)
    .filter(key => key.startsWith('Quiz'))
    .sort((a, b) => {
      const numA = parseInt(a.replace('Quiz', ''));
      const numB = parseInt(b.replace('Quiz', ''));
      return numA - numB;
    });

  // Function to find which week should be active based on current date
  const findCurrentWeekIndex = (weeksData) => {
    const now = new Date();

    for (let i = 0; i < weeksData.length; i++) {
      const week = weeksData[i];
      if (week.startTime && week.endTime) {
        const startTime = new Date(week.startTime);
        const endTime = new Date(week.endTime);

        // Check if current time is within this week's time range
        if (now >= startTime && now <= endTime) {
          return i;
        }
      }
    }

    // If no week matches current time, find the closest upcoming week
    for (let i = 0; i < weeksData.length; i++) {
      const week = weeksData[i];
      if (week.startTime) {
        const startTime = new Date(week.startTime);
        if (now < startTime) {
          return i; // Return the first upcoming week
        }
      }
    }

    // If all weeks are in the past, return the last week
    return weeksData.length > 0 ? weeksData.length - 1 : 0;
  };

  // Function to get week status text


  // Fetch all weeks data from Firebase (tối ưu)
  useEffect(() => {
    const fetchAllWeeks = async () => {
      try {
        setLoading(true);
        const weeksData = await getAllWeeksWithQuizData();

        // Convert Firestore timestamps to Date objects if they exist
        weeksData.forEach(week => {
          if (week.startTime && typeof week.startTime.toDate === 'function') {
            week.startTime = week.startTime.toDate();
          }
          if (week.endTime && typeof week.endTime.toDate === 'function') {
            week.endTime = week.endTime.toDate();
          }
        });

        // Sort weeks by id (week1, week2, etc.)
        weeksData.sort((a, b) => {
          const aNum = parseInt(a.id.replace('week', ''));
          const bNum = parseInt(b.id.replace('week', ''));
          return aNum - bNum;
        });

        setAllWeeksData(weeksData);

        // Auto-select current week based on real time
        const currentWeekIdx = findCurrentWeekIndex(weeksData);
        if (currentWeekIdx !== -1) {
          setCurrentWeekIndex(currentWeekIdx);
        }
      } catch {
        setAllWeeksData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAllWeeks();
  }, []);

  const toggleExpand = (quizKey) => {
    // Ngăn chặn expand khi đang edit
    if (editingQuiz) return;
    setExpandedQuiz(expandedQuiz === quizKey ? null : quizKey);
  };

  const handleEditQuiz = (quizKey) => {
    // Đóng expanded quiz khác khi mở edit
    setExpandedQuiz(null);
    setEditingQuiz(quizKey);
    // Ngăn scroll body
    document.body.classList.add('modal-open');
  };

  const handleSaveQuiz = async (quizKey, updatedQuiz) => {
    try {
      // Get current week
      const currentWeek = allWeeksData[currentWeekIndex];

      // Update in Firebase
      await updateQuizInWeek(currentWeek.id, quizKey, updatedQuiz);

      // Update local state
      setAllWeeksData(prev => {
        const newData = [...prev];
        newData[currentWeekIndex] = {
          ...newData[currentWeekIndex],
          [quizKey]: updatedQuiz
        };
        return newData;
      });

      // Close edit modal
      setEditingQuiz(null);
      // Cho phép scroll body lại
      document.body.classList.remove('modal-open');

      // Show success message
      showToast('Cập nhật quiz thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi cập nhật quiz: ' + error.message, 'error');
    }
  };

  const handleDeleteQuiz = async (quizKey) => {
    // Confirm deletion
    const confirmDelete = window.confirm(
      `⚠️ Bạn có chắc chắn muốn xóa ${quizKey}?\n\nHành động này không thể hoàn tác!`
    );
    
    if (!confirmDelete) return;

    try {
      // Get current week
      const currentWeek = allWeeksData[currentWeekIndex];

      // Delete from Firebase by setting to null
      await updateQuizInWeek(currentWeek.id, quizKey, null);

      // Update local state - remove the quiz
      setAllWeeksData(prev => {
        const newData = [...prev];
        const updatedWeek = { ...newData[currentWeekIndex] };
        delete updatedWeek[quizKey];
        newData[currentWeekIndex] = updatedWeek;
        return newData;
      });

      // Close edit modal
      setEditingQuiz(null);
      // Cho phép scroll body lại
      document.body.classList.remove('modal-open');

      // Show success message
      showToast('Xóa quiz thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi xóa quiz: ' + error.message, 'error');
    }
  };

  const handleCancelEdit = () => {
    setEditingQuiz(null);
    // Reset expanded state để tránh conflicts
    setExpandedQuiz(null);
    // Cho phép scroll body lại
    document.body.classList.remove('modal-open');
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
      showToast('Cập nhật thời gian thành công!', 'success');
    } catch (error) {
      showToast('Lỗi khi cập nhật thời gian: ' + error.message, 'error');
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
        <div className="quizz-content">
          <div className="loading">
            <div className="spinner"></div>
            <p>Đang tải danh sách quiz...</p>
          </div>
        </div>
      </div>
    );
  }

  if (allWeeksData.length === 0) {
    return (
      <div className="quizz-container">
        <div className="quizz-content">
          <div className="empty-state">
            <h2> Không có dữ liệu quiz</h2>
            <p>Hiện tại chưa có document nào trong Firebase.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quizz-container">
      <div className="quizz-content">
        <header className="quizz-header">
          <h1> {currentWeekData.id || 'Loading...'} - Quiz List</h1>

          {/* Week Navigation */}
          {allWeeksData.length > 1 && (
            <div className="week-navigation">

              <span className="week-indicator">
                Week {currentWeekIndex + 1} of {allWeeksData.length}
              </span>
              <div className='nav-buttons'>
                <button
                  onClick={() => setCurrentWeekIndex(Math.max(0, currentWeekIndex - 1))}
                  disabled={currentWeekIndex === 0}
                  className="nav-btn prev-btn"
                >
                  ←Trước
                </button>
                <button
                  onClick={() => {
                    const currentIdx = findCurrentWeekIndex(allWeeksData);
                    if (currentIdx !== -1) setCurrentWeekIndex(currentIdx);
                  }}
                  className="nav-btn current-week-btn"
                  title="Chuyển đến tuần hiện tại"
                >
                  Hiện tại
                </button>
                <button
                  onClick={() => setCurrentWeekIndex(Math.min(allWeeksData.length - 1, currentWeekIndex + 1))}
                  disabled={currentWeekIndex === allWeeksData.length - 1}
                  className="nav-btn next-btn"
                >
                  Sau→
                </button>
              </div>


            </div>
          )}

          <div className="document-info">
            <p><strong>Tuần:</strong> {currentWeekData.id || 'N/A'}</p>
            <p><strong>Tổng quiz:</strong> {quizKeys.length}</p>
            <p><strong>Open:</strong> {currentWeekData.startTime ? formatDateTime(currentWeekData.startTime) : 'N/A'}</p>
            <p><strong>Close:</strong> {currentWeekData.endTime ? formatDateTime(currentWeekData.endTime) : 'N/A'}</p>
            <button onClick={handleEditDocument} className="edit-document-btn">
              Chỉnh sửa thời gian
            </button>
          </div>
        </header>

        <div className="quizz-grid">
          {quizKeys.map((quizKey) => {
            const quiz = currentWeekData[quizKey];
            const isExpanded = expandedQuiz === quizKey;
            const isEditing = editingQuiz === quizKey;

            return (
              <div key={quizKey} className={`quiz-card ${editingQuiz ? 'disabled' : ''}`}>
                <div className="quiz-header">
                  <h3>{quizKey}</h3>
                  <span className="answer-count">{quiz.soDapAn.length} đáp án</span>
                </div>

                <div className="quiz-info">
                  <p><strong>Đáp án đúng:</strong> <span className="correct-answer">{quiz.dapAnDung}</span></p>
                  <p><strong>Số đáp án:</strong> {quiz.soDapAn.length} ({quiz.soDapAn.join(', ')})</p>
                  <p><strong>Link:</strong>
                    <a href={quiz.link} target="_blank" rel="noopener noreferrer" className="quiz-link">
                      Xem file
                    </a>
                  </p>
                </div>

                <div className="quiz-actions">
                  <button
                    onClick={() => toggleExpand(quizKey)}
                    className="expand-btn"
                    disabled={editingQuiz && !isEditing}
                  >
                    {isExpanded ? 'Thu gọn' : 'Xem chi tiết'}
                  </button>
                  <button
                    onClick={() => handleEditQuiz(quizKey)}
                    className="edit-btn"
                    disabled={editingQuiz && !isEditing}
                  >
                    Chỉnh sửa
                  </button>
                </div>

                {isExpanded && (
                  <div className="quiz-details">
                    <h4>Chi tiết {quizKey}:</h4>

                    <div className="quiz-detail-content">
                      <div className="quiz-image-section">
                        <p><strong>Hình ảnh câu hỏi:</strong></p>
                        <img
                          src={quiz.link}
                          alt={`${quizKey} image`}
                          className="quiz-image"
                          style={{
                            maxWidth: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            border: '1px solid #ddd',
                            borderRadius: '4px'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                          }}
                        />
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
                      <div className="quiz-explanation">
                        <p><strong>Giải thích:</strong></p>
                        <div className="explanation-text">{quiz.giaiThich}</div>
                      </div>


                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Quiz Edit Modal - Di chuyển ra ngoài để hiển thị đúng */}
        {editingQuiz && (
          <QuizEditForm
            quiz={currentWeekData[editingQuiz]}
            quizKey={editingQuiz}
            onSave={handleSaveQuiz}
            onDelete={handleDeleteQuiz}
            onCancel={handleCancelEdit}
          />
        )}

        {editingDocument && (
          <DocumentEditModal
            startTime={currentWeekData.startTime}
            endTime={currentWeekData.endTime}
            onSave={handleSaveDocument}
            onCancel={() => setEditingDocument(false)}
          />
        )}
      </div>
    </div>
  );
};

// Component để chỉnh sửa quiz
const QuizEditForm = ({ quiz, quizKey, onSave, onDelete, onCancel }) => {
  const [formData, setFormData] = useState({
    dapAnDung: quiz.dapAnDung,
    giaiThich: quiz.giaiThich,
    link: quiz.link,
    soLuongDapAn: quiz.soDapAn.length // Thay đổi: lưu số lượng thay vì chuỗi
  });

  // Image upload states
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onCancel]);

  // Function để tạo đáp án tự động từ số lượng
  const generateAnswers = (count) => {
    const answers = [];
    for (let i = 0; i < count; i++) {
      answers.push(String.fromCharCode(65 + i)); // A, B, C, D, E, F...
    }
    return answers;
  };

  // Handle file selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setImageFile(null);
      setImagePreview('');
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showToast('❌ Vui lòng chọn file ảnh hợp lệ', 'error');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      showToast('❌ Kích thước file phải nhỏ hơn 10MB', 'error');
      return;
    }

    setImageFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // Upload image to Cloudinary
  const uploadImage = async () => {
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      showToast('📤 Đang tải ảnh lên...', 'info');
      
      const uploadedUrl = await uploadImageToCloudinary(imageFile);
      showToast('✅ Tải ảnh thành công!', 'success');
      
      return uploadedUrl;
    } catch (error) {
      showToast(`❌ Lỗi tải ảnh: ${error.message}`, 'error');
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let finalImageUrl = formData.link;

    // Upload new image if selected
    if (imageFile) {
      finalImageUrl = await uploadImage();
      if (!finalImageUrl) {
        return; // Upload failed, stop submission
      }
    }

    const updatedQuiz = {
      ...quiz,
      dapAnDung: formData.dapAnDung,
      giaiThich: formData.giaiThich,
      link: finalImageUrl,
      soDapAn: generateAnswers(parseInt(formData.soLuongDapAn)) // Tạo đáp án tự động
    };
    onSave(quizKey, updatedQuiz);
  };

  // Handle click outside modal
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return (
    <div className="edit-form-overlay" onClick={handleOverlayClick}>
      <div className="edit-form">
        <div className="modal-header">
          <h4>✏️ Chỉnh sửa {quizKey}</h4>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onCancel}
            aria-label="Đóng modal"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Hình ảnh câu hỏi:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                style={{marginBottom: '10px', height: '100px'}}
              />
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginBottom: '10px' }}>
                Chọn file ảnh mới (JPG, PNG, GIF, WebP). Tối đa 10MB. Để trống nếu không muốn thay đổi.
              </small>
              
              {/* Image Preview for new file */}
              {imagePreview && (
                <div className="image-preview" style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#666', marginBottom: '5px' }}>
                    Ảnh mới sẽ được upload:
                  </p>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '200px', 
                      maxHeight: '150px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      objectFit: 'contain'
                    }} 
                  />
                  <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    {imageFile?.name} ({(imageFile?.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                </div>
              )}
              
              {/* Current image display */}
              {formData.link && !imagePreview && (
                <div className="current-image" style={{ marginBottom: '10px' }}>
                  <p style={{ fontSize: '14px', color: '#22543d', marginBottom: '5px' }}>
                    Ảnh hiện tại:
                  </p>
                  <img 
                    src={formData.link} 
                    alt="Current" 
                    style={{ 
                      width: '100%', 
                      height: 'auto', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      objectFit: 'contain'
                    }} 
                  />
                </div>
              )}
              
              {uploadingImage && (
                <div style={{ marginBottom: '10px', color: '#667eea' }}>
                  📤 Đang tải ảnh lên...
                </div>
              )}

              
              {imageFile && (
                <small style={{ color: '#666', fontSize: '11px', display: 'block', marginTop: '5px' }}>
                  Link sẽ được cập nhật tự động sau khi upload file ảnh mới
                </small>
              )}
            </div>

            <div className="form-group">
              <label>Số lượng đáp án:</label>
              <input
                type="number"
                min="2"
                max="10"
                value={formData.soLuongDapAn}
                onChange={(e) => setFormData(prev => ({ ...prev, soLuongDapAn: e.target.value }))}
                placeholder="Nhập số (VD: 4 sẽ tạo A, B, C, D)"
                required
              />
              {formData.soLuongDapAn && parseInt(formData.soLuongDapAn) > 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '8px 12px',
                  backgroundColor: '#e3f2fd',
                  borderRadius: '4px',
                  border: '1px solid #1976d2'
                }}>
                  <strong>Preview đáp án:</strong> <span style={{ color: '#000' }}>{generateAnswers(parseInt(formData.soLuongDapAn)).join(', ')}</span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Đáp án đúng:</label>
              <select
                value={formData.dapAnDung}
                onChange={(e) => setFormData(prev => ({ ...prev, dapAnDung: e.target.value }))}
                required
              >
                <option value="">-- Chọn đáp án đúng --</option>
                {formData.soLuongDapAn && parseInt(formData.soLuongDapAn) > 0 &&
                  generateAnswers(parseInt(formData.soLuongDapAn)).map(answer => (
                    <option key={answer} value={answer}>{answer}</option>
                  ))
                }
              </select>
            </div>

            <div className="form-group">
              <label>Giải thích:</label>
              <textarea
                value={formData.giaiThich}
                onChange={(e) => setFormData(prev => ({ ...prev, giaiThich: e.target.value }))}
                rows={5}
                required
              />
            </div>

            <div className="form-actions">
              <div className="danger-actions">
                <button 
                  type="button" 
                  onClick={() => onDelete(quizKey)} 
                  className="delete-btn"
                >
                  Xóa quiz này
                </button>
              </div>
              <div className="primary-actions">
                <button type="button" onClick={onCancel} className="cancel-btn">❌ Hủy</button>
                <button type="submit" className="save-btn">💾 Lưu</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// Component để chỉnh sửa thời gian document
const DocumentEditModal = ({ startTime, endTime, onSave, onCancel }) => {
  // Helper function to format Date for datetime-local input (fix timezone issue)
  const formatDateTimeLocal = (date) => {
    // Add 7 hours to compensate for Vietnam timezone
    const adjustedDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return adjustedDate.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    startTime: formatDateTimeLocal(startTime),
    endTime: formatDateTimeLocal(endTime)
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
        <div className="modal-header" style={{borderRadius:'0px'}}>
          <h3>Chỉnh sửa thời gian</h3>
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

          <div className="form-actions" style={{padding:'0px 1vw'}}>
            
            <button type="button" onClick={onCancel} className="cancel-btn">❌ Hủy</button>
            <button type="submit" className="save-btn">Lưu thay đổi</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuizzList;
