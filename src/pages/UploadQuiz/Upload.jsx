import React, { useState, useEffect } from 'react';
import { getAllWeeks, addQuizToWeek, updateQuizInWeek, getWeekById } from '../../services/weekQuizService';
import { uploadImageToCloudinary } from '../../utils/cloudinaryUtils.js';
import './Upload.css';

const Upload = () => {
  // Form state
  const [selectedWeek, setSelectedWeek] = useState('');
  const [newWeek, setNewWeek] = useState('');
  const [quizId, setQuizId] = useState('');
  const [dapAnDung, setDapAnDung] = useState('');
  const [giaiThich, setGiaiThich] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
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
      setMessage('Lỗi khi tải danh sách week: ' + error.message);
    }
  };

  // Helper function to convert Date to datetime-local format without timezone shift
  const formatDateTimeLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleWeekChange = async (weekValue) => {
    setSelectedWeek(weekValue);
    if (weekValue && weekValue !== 'new') {
      try {
        const weekData = await getWeekById(weekValue);
        if (weekData) {
          // Auto-fill startTime và endTime từ week data
          if (weekData.startTime) {
            const startDate = weekData.startTime.toDate ? weekData.startTime.toDate() : new Date(weekData.startTime);
            const startTimeString = formatDateTimeLocal(startDate);
            setStartTime(startTimeString);
          }

          if (weekData.endTime) {
            const endDate = weekData.endTime.toDate ? weekData.endTime.toDate() : new Date(weekData.endTime);
            const endTimeString = formatDateTimeLocal(endDate);
            setEndTime(endTimeString);
          }
        }
      } catch {
        // Silent error handling for week data fetch
      }
    } else if (weekValue === 'new') {
      // Clear times when creating new week
      setStartTime('');
      setEndTime('');
    }
  };

  const addAnswerChoice = () => {
    // Tự động điền chữ cái cho đáp án mới
    const newIndex = soDapAn.length;
    const newLetter = String.fromCharCode(65 + newIndex); // A, B, C, D, E, F...
    setSoDapAn([...soDapAn, newLetter]);
    setMessage(`✅ Đã thêm đáp án "${newLetter}"`);
    // Clear message after 2 seconds
    setTimeout(() => setMessage(''), 2000);
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
      setMessage('❌ Vui lòng chọn file ảnh hợp lệ');
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setMessage('❌ Kích thước file phải nhỏ hơn 10MB');
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
      setMessage('📤 Đang tải ảnh lên...');
      
      const uploadedUrl = await uploadImageToCloudinary(imageFile);
      setImageUrl(uploadedUrl);
      setMessage('✅ Tải ảnh thành công!');
      
      return uploadedUrl;
    } catch (error) {
      console.error('Image upload error:', error);
      setMessage(`❌ Lỗi tải ảnh: ${error.message}`);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const resetForm = () => {
    setQuizId('');
    setDapAnDung('');
    setGiaiThich('');
    setImageFile(null);
    setImageUrl('');
    setImagePreview('');
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

    // Chỉ validate thời gian khi tạo week mới
    if (selectedWeek === 'new') {
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

      // Upload image first if there's a new image file
      let finalImageUrl = imageUrl; // Use existing URL if available
      if (imageFile && !imageUrl) {
        finalImageUrl = await uploadImage();
        if (!finalImageUrl) {
          setLoading(false);
          return; // Upload failed, stop execution
        }
      }

      // Chỉ validate và tạo Date objects khi tạo week mới
      let startDateTime = null, endDateTime = null;

      if (selectedWeek === 'new') {
        // Create and validate Date objects
        startDateTime = new Date(startTime);
        endDateTime = new Date(endTime);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          setMessage('❌ Thời gian bắt đầu và kết thúc không hợp lệ');
          setLoading(false);
          return;
        }
      }

      const quizData = {
        dapAnDung,
        giaiThich,
        link: finalImageUrl || '', // Use Cloudinary URL instead of Google Drive link
        soDapAn: soDapAn.filter(answer => answer.trim()), // Loại bỏ câu trả lời trống
        // Note: Don't include startTime/endTime in quizData for service
      };

      if (isEditMode) {
        await updateQuizInWeek(weekToUse, quizId, quizData);
        setMessage('✅ Cập nhật quiz thành công!');
      } else {
        // Pass startDateTime/endDateTime only when creating new week
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
        <h1>Thêm Quiz Mới</h1>

        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="upload-form">
          {/* Week Selection */}
          <div className="form-section">
            <h3>Chọn Week</h3>
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
              <label htmlFor="startTime">
                Thời gian bắt đầu:
                {selectedWeek && selectedWeek !== 'new' && (
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                    {' '}(Tự động từ week đã chọn)
                  </span>
                )}
              </label>
              <input
                type="datetime-local"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={selectedWeek && selectedWeek !== 'new'}
                required
                style={{
                  backgroundColor: selectedWeek && selectedWeek !== 'new' ? '#f5f5f5' : 'white',
                  cursor: selectedWeek && selectedWeek !== 'new' ? 'not-allowed' : 'text'
                }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="endTime">
                Thời gian kết thúc:
                {selectedWeek && selectedWeek !== 'new' && (
                  <span style={{ fontSize: '0.8em', color: '#666', fontWeight: 'normal' }}>
                    {' '}(Tự động từ week đã chọn)
                  </span>
                )}
              </label>
              <input
                type="datetime-local"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={selectedWeek && selectedWeek !== 'new'}
                required
                style={{
                  backgroundColor: selectedWeek && selectedWeek !== 'new' ? '#f5f5f5' : 'white',
                  cursor: selectedWeek && selectedWeek !== 'new' ? 'not-allowed' : 'text'
                }}
              />
            </div>
          </div>

          {/* Quiz Information */}
          <div className="form-section">
            <h3>Thông tin Quiz</h3>
            <div className="form-group">
              <label htmlFor="quizId">Quiz ID:</label>
              <select
                id="quizId"
                value={quizId}
                onChange={(e) => setQuizId(e.target.value)}
                required
              >
                <option value="">-- Chọn Quiz ID --</option>
                <option value="Quiz1">Quiz1</option>
                <option value="Quiz2">Quiz2</option>
                <option value="Quiz3">Quiz3</option>
                <option value="Quiz4">Quiz4</option>
                <option value="Quiz5">Quiz5</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="image">Hình ảnh câu hỏi:</label>
              <input
                type="file"
                id="image"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
                style={{height: '200px', border: '1px solid #ccc', borderRadius: '4px'}}
              />
              <small style={{ color: '#666', fontSize: '12px', marginTop: '5px', display: 'block' }}>
                Chọn file ảnh (JPG, PNG, GIF, WebP). Tối đa 10MB.
              </small>
              
              {/* Image Preview */}
              {imagePreview && (
                <div className="image-preview" style={{ marginTop: '10px' }}>
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
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
              
              {/* Show current uploaded image URL if exists */}
              {imageUrl && !imagePreview && (
                <div className="current-image" style={{ marginTop: '10px' }}>
                  <p style={{ fontSize: '12px', color: '#22543d', marginBottom: '5px' }}>
                    ✅ Ảnh đã được tải lên
                  </p>
                  <img 
                    src={imageUrl} 
                    alt="Current" 
                    style={{ 
                      maxWidth: '300px', 
                      maxHeight: '200px', 
                      border: '1px solid #ddd', 
                      borderRadius: '4px',
                      objectFit: 'contain'
                    }} 
                  />
                </div>
              )}
              
              {uploadingImage && (
                <div style={{ marginTop: '10px', color: '#667eea' }}>
                  📤 Đang tải ảnh lên...
                </div>
              )}
            </div>

            {/* Answer Choices */}
            <div className="form-group">
              <label style={{ marginBottom: '10px', display: 'block' }}>Các lựa chọn đáp án:</label>
              {soDapAn.map((answer, index) => (
                <div key={index} className="answer-choice-group" style={{ marginBottom: '10px' }}>
                  <div className="form-group" style={{ margin: '0' }}>
                    <label htmlFor={`answer-${index}`}>Đáp án {String.fromCharCode(65 + index)}:</label>
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

              <div style={{ marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={addAnswerChoice}
                  className="add-answer-btn"
                >
                  + Thêm lựa chọn đáp án
                </button>
              </div>
            </div>

            {/* Correct Answer Selection */}
            <div className="form-group">
              <label htmlFor="dapAnDung">Đáp án đúng:</label>
              <select
                id="dapAnDung"
                value={dapAnDung}
                onChange={(e) => setDapAnDung(e.target.value)}
                required
              >
                <option value="">-- Chọn đáp án đúng --</option>
                {soDapAn
                  .filter(answer => answer.trim()) // Chỉ hiển thị đáp án đã điền
                  .map((answer) => {
                    const originalIndex = soDapAn.indexOf(answer);
                    return (
                      <option key={originalIndex} value={answer}>
                        {String.fromCharCode(65 + originalIndex)}
                      </option>
                    );
                  })
                }
              </select>
              {soDapAn.filter(answer => answer.trim()).length === 0 && (
                <p style={{ color: '#666', fontSize: '0.9em', margin: '5px 0 0 0' }}>
                  Vui lòng thêm ít nhất một đáp án ở trên để chọn đáp án đúng
                </p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="giaiThich">Giải thích:</label>
              <textarea
                id="giaiThich"
                value={giaiThich}
                onChange={(e) => setGiaiThich(e.target.value)}
                placeholder="Nhập giải thích chi tiết cho câu hỏi..."
                rows={4}
                required
                style={{ boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button type="button" onClick={resetForm} className="reset-btn">
              Reset form
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Đang xử lý...' : (isEditMode ? 'Cập nhật' : 'Thêm quiz')}
            </button>

            
          </div>
        </form>
      </div>
    </div>
  );
};

export default Upload;
