import { db } from '../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Lấy tất cả dữ liệu quiz đã làm của user (tối ưu)
 * @param {string} username - MSSV của student (key trong week document)
 * @param {Array} specificWeeks - Mảng các week cần lấy (optional)
 * @returns {Promise<Object>} Dữ liệu quiz đã làm theo tuần
 */
export const getUserQuizData = async (username, specificWeeks = null) => {
  const result = {};
  
  // Nếu không chỉ định weeks cụ thể, lấy tất cả từ week1-12
  const weekNumbers = specificWeeks || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Tạo array promises để load song song
  const promises = weekNumbers.map(async (weekNum) => {
    const weekKey = typeof weekNum === 'string' ? weekNum : `week${weekNum}`;
    const weekData = await getUserQuizByWeek(username, weekKey);
    
    if (Object.keys(weekData).length > 0) {
      return { weekKey, weekData };
    }
    return null;
  });
  
  // Chờ tất cả promises hoàn thành
  const results = await Promise.all(promises);
  
  // Gộp kết quả
  results.forEach(item => {
    if (item) {
      result[item.weekKey] = item.weekData;
    }
  });
  
  return result;
};

/**
 * Lấy dữ liệu quiz đã làm của user theo tuần cụ thể
 * @param {string} username - MSSV của student (key trong week document)
 * @param {string} weekKey - Key của tuần (vd: 'week1', 'week2')
 * @returns {Promise<Object>} Dữ liệu quiz đã làm trong tuần
 */
export const getUserQuizByWeek = async (username, weekKey) => {
  const weekRef = doc(db, 'users_quiz', weekKey);
  const weekSnap = await getDoc(weekRef);
  
  if (weekSnap.exists()) {
    const weekData = weekSnap.data();
    return weekData[username] || {};
  }
  
  return {};
};

/**
 * Kiểm tra xem user đã làm quiz nào chưa
 * @param {string} username - MSSV của student (sử dụng username từ auth)
 * @param {string} weekKey - Key của tuần
 * @param {string} quizKey - Key của quiz (vd: 'Quiz1', 'Quiz2')
 * @returns {Promise<string|null>} Đáp án đã chọn hoặc null nếu chưa làm
 */
export const getUserQuizAnswer = async (username, weekKey, quizKey) => {
  const weekData = await getUserQuizByWeek(username, weekKey);
  return weekData[quizKey] || null;
};

/**
 * Lấy tất cả tuần có dữ liệu quiz (tối ưu với Promise.all)
 * @param {string} username - MSSV của student (key trong week documents)
 * @returns {Promise<Array>} Danh sách tuần có dữ liệu
 */
export const getAvailableWeeks = async (username) => {
  const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Tạo promises để check tất cả weeks song song
  const promises = weekNumbers.map(async (weekNum) => {
    const weekKey = `week${weekNum}`;
    const weekRef = doc(db, 'users_quiz', weekKey);
    const weekSnap = await getDoc(weekRef);
    
    if (weekSnap.exists()) {
      const weekData = weekSnap.data();
      // Kiểm tra xem có dữ liệu cho user này không
      if (weekData[username] && Object.keys(weekData[username]).length > 0) {
        return weekKey;
      }
    }
    return null;
  });
  
  // Chờ tất cả promises và lọc kết quả
  const results = await Promise.all(promises);
  return results.filter(week => week !== null).sort();
};

/**
 * Lấy tất cả tuần có trong database (tối ưu với Promise.all)
 * @returns {Promise<Array>} Danh sách tất cả tuần có trong collection users_quiz
 */
export const getAllAvailableWeeks = async () => {
  const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  
  // Tạo promises để check tất cả weeks song song
  const promises = weekNumbers.map(async (weekNum) => {
    const weekKey = `week${weekNum}`;
    const weekRef = doc(db, 'users_quiz', weekKey);
    const weekSnap = await getDoc(weekRef);
    
    return weekSnap.exists() ? weekKey : null;
  });
  
  // Chờ tất cả promises và lọc kết quả
  const results = await Promise.all(promises);
  return results.filter(week => week !== null).sort();
};

/**
 * Tính điểm số cho một tuần
 * @param {Object} userWeekData - Dữ liệu quiz đã làm trong tuần
 * @param {Object} correctAnswers - Đáp án đúng
 * @returns {Object} Thông tin điểm số { correct, total, percentage }
 */
export const calculateWeekScore = (userWeekData, correctAnswers) => {
  if (!userWeekData || !correctAnswers) return { correct: 0, total: 0, percentage: 0 };
  
  let correct = 0;
  let total = 0;
  
  Object.keys(correctAnswers).forEach(quizKey => {
    if (userWeekData[quizKey] !== undefined) {
      total++;
      if (userWeekData[quizKey] === correctAnswers[quizKey]) {
        correct++;
      }
    }
  });
  
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  
  return { correct, total, percentage };
};

/**
 * Lấy toàn bộ dữ liệu của một tuần (tất cả user trong tuần đó)
 * @param {string} weekKey - Key của tuần (vd: 'week1')
 * @returns {Promise<Object>} Dữ liệu document của tuần (mỗi key là mssv -> answers object)
 */
export const getWeekData = async (weekKey) => {
  try {
    const weekRef = doc(db, 'users_quiz', weekKey);
    const weekSnap = await getDoc(weekRef);

    if (weekSnap.exists()) {
      return weekSnap.data();
    }

    return {};
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu tuần ${weekKey}:`, error);
    return {};
  }
};