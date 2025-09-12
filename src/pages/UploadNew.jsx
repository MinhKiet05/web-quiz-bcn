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
    console.log('=== WEEK CHANGE ===');
    console.log('weekValue:', weekValue);
    console.log('===================');
    
    setSelectedWeek(weekValue);
    if (weekValue && weekValue !== 'new') {
      try {
        const weekData = await getWeekById(weekValue);
        if (weekData) {
          // Load thời gian từ week có sẵn và hiển thị (readonly)
          if (weekData.startTime) {
            let startTimeString = '';
            if (weekData.startTime.toDate) {
              // Firestore Timestamp
              startTimeString = weekData.startTime.toDate().toISOString().slice(0, 16);
            } else if (weekData.startTime.seconds) {
              // Firestore Timestamp object
              startTimeString = new Date(weekData.startTime.seconds * 1000).toISOString().slice(0, 16);
            } else if (weekData.startTime instanceof Date) {
              // Already a Date object
              startTimeString = weekData.startTime.toISOString().slice(0, 16);
            }
            setStartTime(startTimeString);
          }
          if (weekData.endTime) {
            let endTimeString = '';
            if (weekData.endTime.toDate) {
              // Firestore Timestamp
              endTimeString = weekData.endTime.toDate().toISOString().slice(0, 16);
            } else if (weekData.endTime.seconds) {
              // Firestore Timestamp object
              endTimeString = new Date(weekData.endTime.seconds * 1000).toISOString().slice(0, 16);
            } else if (weekData.endTime instanceof Date) {
              // Already a Date object
              endTimeString = weekData.endTime.toISOString().slice(0, 16);
            }
            setEndTime(endTimeString);
          }
          console.log('Week data loaded:', weekData);
        }
      } catch (error) {
        console.error('Error fetching week data:', error);
      }
    } else if (weekValue === 'new') {
      // Reset thời gian khi chọn tạo week mới
      setStartTime('');
      setEndTime('');
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
    console.log('=== VALIDATE FORM ===');
    
    const weekToUse = selectedWeek === 'new' ? newWeek : selectedWeek;
    console.log('weekToUse:', weekToUse);
    console.log('selectedWeek:', selectedWeek);
    console.log('newWeek:', newWeek);
    
    // Comment out all validations for testing
    /*
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
    */
    console.log('=== VALIDATE FORM PASSED ===');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('=== HANDLE SUBMIT START ===');
    console.log('selectedWeek:', selectedWeek);
    console.log('startTime raw:', startTime);
    console.log('endTime raw:', endTime);
    console.log('===============================');
    
    if (!validateForm()) return;

    setLoading(true);
    setMessage('');

    try {
      const weekToUse = selectedWeek === 'new' ? newWeek : selectedWeek;
      
      console.log('=== SUBMIT DEBUG ===');
      console.log('selectedWeek:', selectedWeek);
      console.log('newWeek:', newWeek);
      console.log('weekToUse:', weekToUse);
      console.log('isEditMode:', isEditMode);
      console.log('====================');
      
      const quizData = {
        dapAnDung,
        giaiThich,
        link,
        soDapAn: soDapAn.filter(answer => answer.trim()) // Loại bỏ câu trả lời trống
      };

      // Prepare time parameters only for new week
      let startTimeDate = null;
      let endTimeDate = null;
      
      if (selectedWeek === 'new') {
        console.log('Creating new week with times:', { startTime, endTime });
        
        if (startTime) {
          // Try different parsing methods
          startTimeDate = new Date(startTime);
          // If invalid, try adding timezone
          if (isNaN(startTimeDate)) {
            startTimeDate = new Date(startTime + 'T00:00:00');
          }
          console.log('Parsed startTime:', startTimeDate, 'Valid:', !isNaN(startTimeDate));
        }
        if (endTime) {
          // Try different parsing methods
          endTimeDate = new Date(endTime);
          // If invalid, try adding timezone
          if (isNaN(endTimeDate)) {
            endTimeDate = new Date(endTime + 'T00:00:00');
          }
          console.log('Parsed endTime:', endTimeDate, 'Valid:', !isNaN(endTimeDate));
        }
        
        // Validation: nếu tạo week mới mà không có thời gian thì báo lỗi
        if (!startTime || !startTime.trim()) {
          setMessage('❌ Vui lòng nhập thời gian bắt đầu khi tạo week mới');
          setLoading(false);
          return;
        }
        if (!endTime || !endTime.trim()) {
          setMessage('❌ Vui lòng nhập thời gian kết thúc khi tạo week mới');
          setLoading(false);
          return;
        }
        if (!startTimeDate || isNaN(startTimeDate)) {
          setMessage('❌ Thời gian bắt đầu không hợp lệ. Raw value: ' + startTime);
          setLoading(false);
          return;
        }
        if (!endTimeDate || isNaN(endTimeDate)) {
          setMessage('❌ Thời gian kết thúc không hợp lệ. Raw value: ' + endTime);
          setLoading(false);
          return;
        }
      }

      if (isEditMode) {
        await updateQuizInWeek(weekToUse, quizId, quizData);
        setMessage('✅ Cập nhật quiz thành công!');
      } else {
        // Pass time parameters only when creating new week
        if (selectedWeek === 'new') {
          console.log('=== DEBUG NEW WEEK ===');
          console.log('weekToUse:', weekToUse);
          console.log('startTimeDate:', startTimeDate);
          console.log('endTimeDate:', endTimeDate);
          console.log('startTime raw:', startTime);
          console.log('endTime raw:', endTime);
          console.log('=== END DEBUG ===');
          
          await addQuizToWeek(weekToUse, quizId, quizData, startTimeDate, endTimeDate);
        } else {
          // For existing week, don't pass time parameters
          console.log('Calling addQuizToWeek without time:', { weekToUse, quizId });
          await addQuizToWeek(weekToUse, quizId, quizData);
        }
        setMessage('✅ Thêm quiz thành công!');
      }

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
                    {week.id}
                  </option>
                ))}
                <option value="new">+ Tạo week mới</option>
              </select>
            </div>

            {selectedWeek === 'new' && (
              <>
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
                
                <div className="form-group">
                  <label htmlFor="startTime">Thời gian bắt đầu: <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="datetime-local"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                  <small>Bắt buộc nhập khi tạo week mới</small>
                </div>
                
                <div className="form-group">
                  <label htmlFor="endTime">Thời gian kết thúc: <span style={{color: 'red'}}>*</span></label>
                  <input
                    type="datetime-local"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                  <small>Bắt buộc nhập khi tạo week mới</small>
                </div>
              </>
            )}

            {selectedWeek && selectedWeek !== 'new' && selectedWeek !== '' && (
              <div className="form-section time-display">
                <h4>⏰ Thời gian của {selectedWeek}</h4>
                <div className="time-info">
                  <div className="form-group">
                    <label>Thời gian bắt đầu:</label>
                    <input
                      type="datetime-local"
                      value={startTime}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Thời gian kết thúc:</label>
                    <input
                      type="datetime-local"
                      value={endTime}
                      readOnly
                      className="readonly-input"
                    />
                  </div>
                  <small>ℹ️ Thời gian này không thể chỉnh sửa khi thêm quiz vào week có sẵn</small>
                </div>
              </div>
            )}
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
