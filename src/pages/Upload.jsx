import React, { useState, useEffect } from 'react';
import { getAllWeeks, addQuizToWeek, updateQuizInWeek, getWeekById } from '../services/weekQuizService';
import './Upload.css';

const Upload = () => {
  // Form state
  const [selectedWeek, setSelectedWeek] = useState('');
  const [newWeek, setNewWeek] = useState('');
  const [quizId, setQuizId] = useState('');
  const [dapAnDung, setDapAnDung] = useState('');
  const [giaiThich, setGiaiThich] = useState('');
  const [link, setLink] = useState('');
  const [soDapAn, setSoDapAn] = useState(['A', 'B', 'C', 'D']);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [weeks, setWeeks] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    fetchWeeks();
  }, []);

  const fetchWeeks = async () => {
    try {
      const data = await getAllWeeks();
      setWeeks(data);
    } catch (error) {
      console.error('Error fetching weeks:', error);
      setMessage('Lỗi khi tải danh sách week: ' + error.message);
    }
  };

  const handleWeekChange = async (weekValue) => {
    setSelectedWeek(weekValue);
    if (weekValue && weekValue !== 'new') {
      try {
        const weekData = await getWeekById(weekValue);
        if (weekData) {
          // Có thể hiển thị các quiz hiện có trong week này
          console.log('Week data:', weekData);
        }
      } catch (error) {
        console.error('Error fetching week data:', error);
      }
    }
  };

  const addAnswerChoice = () => {
    setSoDapAn([...soDapAn, '']);
  };

  const removeAnswerChoice = (index) => {
    if (soDapAn.length > 2) { // Tối thiểu 2 lựa chọn
      const newAnswers = soDapAn.filter((_, i) => i !== index);
      setSoDapAn(newAnswers);
    }
  };

  const updateAnswerChoice = (index, value) => {
    const newAnswers = [...soDapAn];
    newAnswers[index] = value.toUpperCase();
    setSoDapAn(newAnswers);
  };

  const resetForm = () => {
    setQuizId('');
    setDapAnDung('');
    setGiaiThich('');
    setLink('');
    setSoDapAn(['A', 'B', 'C', 'D']);
    setStartTime('');
    setEndTime('');
    setIsEditMode(false);
  };

  const validateForm = () => {
    const weekToUse = selectedWeek === 'new' ? newWeek : selectedWeek;
    
    if (!weekToUse) {
      setMessage('❌ Vui lòng chọn hoặc tạo week mới');
      return false;
    }
    if (!quizId) {
      setMessage('❌ Vui lòng nhập ID quiz (VD: Quiz1, Quiz2)');
      return false;
    }
    if (!dapAnDung) {
      setMessage('❌ Vui lòng nhập đáp án đúng');
      return false;
    }
    if (!soDapAn.includes(dapAnDung)) {
      setMessage('❌ Đáp án đúng phải có trong danh sách lựa chọn');
      return false;
    }
    if (soDapAn.some(answer => !answer.trim())) {
      setMessage('❌ Tất cả lựa chọn đáp án phải được điền');
      return false;
    }
    if (!startTime) {
      setMessage('❌ Vui lòng chọn thời gian bắt đầu');
      return false;
    }
    if (!endTime) {
      setMessage('❌ Vui lòng chọn thời gian kết thúc');
      return false;
    }
    if (new Date(startTime) >= new Date(endTime)) {
      setMessage('❌ Thời gian bắt đầu phải trước thời gian kết thúc');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      const weekToUse = selectedWeek === 'new' ? newWeek : selectedWeek;
      
      // Create and validate Date objects
      const startDateTime = new Date(startTime);
      const endDateTime = new Date(endTime);
      
      console.log('=== UPLOAD.JSX DEBUG ===');
      console.log('startTime raw:', startTime);
      console.log('endTime raw:', endTime);
      console.log('startDateTime:', startDateTime);
      console.log('endDateTime:', endDateTime);
      console.log('startDateTime valid:', !isNaN(startDateTime.getTime()));
      console.log('endDateTime valid:', !isNaN(endDateTime.getTime()));
      
      if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
        setMessage('❌ Thời gian bắt đầu và kết thúc không hợp lệ');
        setLoading(false);
        return;
      }

      const quizData = {
        dapAnDung,
        giaiThich,
        link,
        soDapAn: soDapAn.filter(answer => answer.trim()), // Loại bỏ câu trả lời trống
        // Note: Don't include startTime/endTime in quizData for service
      };

      if (isEditMode) {
        await updateQuizInWeek(weekToUse, quizId, quizData);
        setMessage('✅ Cập nhật quiz thành công!');
      } else {
        await addQuizToWeek(weekToUse, quizId, quizData, startDateTime, endDateTime);
        setMessage('✅ Thêm quiz thành công!');
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Refresh weeks list if new week was created
      if (selectedWeek === 'new') {
        await fetchWeeks();
        setSelectedWeek(newWeek);
        setNewWeek('');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving quiz:', error);
      setMessage('❌ Lỗi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <div className="upload-form-wrapper">
        <h1>📝 Thêm Quiz Mới</h1>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Week Selection */}
          <div className="form-section">
            <h3>📅 Chọn Week</h3>
            <div className="form-group">
              <label htmlFor="week">Week:</label>
              <select
                id="week"
                value={selectedWeek}
                onChange={(e) => handleWeekChange(e.target.value)}
                required
              >
                <option value="">-- Chọn week --</option>
                {weeks.map((week) => (
                  <option key={week.id} value={week.id}>
                    {week.id} ({Object.keys(week).filter(key => key !== 'id').length} quiz)
                  </option>
                ))}
                <option value="new">+ Tạo week mới</option>
              </select>
            </div>

            {selectedWeek === 'new' && (
              <div className="form-group">
                <label htmlFor="newWeek">Tên week mới:</label>
                <input
                  type="text"
                  id="newWeek"
                  value={newWeek}
                  onChange={(e) => setNewWeek(e.target.value)}
                  placeholder="VD: week2, week3"
                  required
                />
              </div>
            )}

            {/* Thời gian Quiz */}
            <div className="form-group">
              <label htmlFor="startTime">Thời gian bắt đầu:</label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">Thời gian kết thúc:</label>
              <input
                type="datetime-local"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Quiz Information */}
          <div className="form-section">
            <h3>🎯 Thông tin Quiz</h3>
            <div className="form-group">
              <label htmlFor="quizId">Quiz ID:</label>
              <input
                type="text"
                id="quizId"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                placeholder="VD: Quiz1, Quiz2, Quiz3"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dapAnDung">Đáp án đúng:</label>
              <select
                id="dapAnDung"
                value={dapAnDung}
                onChange={(e) => setDapAnDung(e.target.value)}
                required
              >
                <option value="">-- Chọn đáp án đúng --</option>
                {soDapAn.map((answer, index) => (
                  <option key={index} value={answer}>
                    {answer}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="link">Link hình ảnh (Google Drive):</label>
              <input
                type="url"
                id="link"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/file/d/..."
              />
            </div>

            <div className="form-group">
              <label htmlFor="giaiThich">Giải thích:</label>
              <textarea
                id="giaiThich"
                value={giaiThich}
                onChange={(e) => setGiaiThich(e.target.value)}
                placeholder="Nhập giải thích chi tiết cho câu hỏi..."
                rows={4}
              />
            </div>
          </div>

          {/* Answer Choices */}
          <div className="form-section">
            <h3>📋 Các lựa chọn đáp án</h3>
            {soDapAn.map((answer, index) => (
              <div key={index} className="answer-choice-group">
                <div className="form-group">
                  <label htmlFor={`answer-${index}`}>Đáp án {index}:</label>
                  <input
                    type="text"
                    id={`answer-${index}`}
                    value={answer}
                    onChange={(e) => updateAnswerChoice(index, e.target.value)}
                    placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                    required
                  />
                  {soDapAn.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeAnswerChoice(index)}
                      className="remove-answer-btn"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button
              type="button"
              onClick={addAnswerChoice}
              className="add-answer-btn"
            >
              ➕ Thêm lựa chọn
            </button>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? '⏳ Đang xử lý...' : (isEditMode ? '💾 Cập nhật' : '✅ Thêm quiz')}
            </button>
            
            <button type="button" onClick={resetForm} className="reset-btn">
              🔄 Reset form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
