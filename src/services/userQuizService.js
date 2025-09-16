import { db } from '../config/firebase.js';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Lấy tất cả dữ liệu quiz đã làm của user
 * Collection: users_quiz
 * Document ID: week1, week2, ... (theo tuần)
 * Structure mỗi document: {
 *   22666271: { Quiz1: "A", Quiz2: "B", Quiz3: "B", Quiz4: "B", Quiz5: "D" },
 *   23682371: { Quiz1: "C", Quiz2: "A", ... },
 *   ...
 * }
 * @param {string} username - MSSV của student (key trong week document)
 * @returns {Promise<Object>} Dữ liệu quiz đã làm theo tuần
 */
export const getUserQuizData = async (username) => {
  try {
    const result = {};
    
    // Lấy dữ liệu từ tất cả các tuần
    const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Có thể extend thêm
    
    for (const weekNum of weekNumbers) {
      const weekKey = `week${weekNum}`;
      const weekData = await getUserQuizByWeek(username, weekKey);
      
      if (Object.keys(weekData).length > 0) {
        result[weekKey] = weekData;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Lỗi khi lấy dữ liệu quiz đã làm:', error);
    throw error;
  }
};

/**
 * Lấy dữ liệu quiz đã làm của user theo tuần cụ thể
 * @param {string} username - MSSV của student (key trong week document)
 * @param {string} weekKey - Key của tuần (vd: 'week1', 'week2')
 * @returns {Promise<Object>} Dữ liệu quiz đã làm trong tuần
 */
export const getUserQuizByWeek = async (username, weekKey) => {
  try {
    const weekRef = doc(db, 'users_quiz', weekKey);
    const weekSnap = await getDoc(weekRef);
    
    if (weekSnap.exists()) {
      const weekData = weekSnap.data();
      // Trả về dữ liệu của user cụ thể trong tuần này
      return weekData[username] || {};
    } else {
      return {};
    }
  } catch (error) {
    console.error(`Lỗi khi lấy dữ liệu quiz tuần ${weekKey}:`, error);
    throw error;
  }
};

/**
 * Kiểm tra xem user đã làm quiz nào chưa
 * @param {string} username - MSSV của student (sử dụng username từ auth)
 * @param {string} weekKey - Key của tuần
 * @param {string} quizKey - Key của quiz (vd: 'Quiz1', 'Quiz2')
 * @returns {Promise<string|null>} Đáp án đã chọn hoặc null nếu chưa làm
 */
export const getUserQuizAnswer = async (username, weekKey, quizKey) => {
  try {
    const weekData = await getUserQuizByWeek(username, weekKey);
    return weekData[quizKey] || null;
  } catch (error) {
    console.error(`Lỗi khi lấy đáp án quiz ${quizKey}:`, error);
    return null;
  }
};

/**
 * Lấy tất cả tuần có dữ liệu quiz
 * @param {string} username - MSSV của student (key trong week documents)
 * @returns {Promise<Array>} Danh sách tuần có dữ liệu
 */
export const getAvailableWeeks = async (username) => {
  try {
    const availableWeeks = [];
    
    // Check từng tuần để xem tuần nào có dữ liệu cho user này
    const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    for (const weekNum of weekNumbers) {
      const weekKey = `week${weekNum}`;
      const weekRef = doc(db, 'users_quiz', weekKey);
      const weekSnap = await getDoc(weekRef);
      
      if (weekSnap.exists()) {
        const weekData = weekSnap.data();
        // Kiểm tra xem có dữ liệu cho user này không
        if (weekData[username] && Object.keys(weekData[username]).length > 0) {
          availableWeeks.push(weekKey);
        }
      }
    }
    
    return availableWeeks.sort();
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tuần:', error);
    return [];
  }
};

/**
 * Lấy tất cả tuần có trong database (không phụ thuộc user cụ thể)
 * @returns {Promise<Array>} Danh sách tất cả tuần có trong collection users_quiz
 */
export const getAllAvailableWeeks = async () => {
  try {
    const availableWeeks = [];
    
    // Check từng tuần để xem tuần nào có tồn tại trong database
    const weekNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    
    for (const weekNum of weekNumbers) {
      const weekKey = `week${weekNum}`;
      const weekRef = doc(db, 'users_quiz', weekKey);
      const weekSnap = await getDoc(weekRef);
      
      if (weekSnap.exists()) {
        availableWeeks.push(weekKey);
      }
    }
    
    return availableWeeks.sort();
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tất cả tuần:', error);
    return [];
  }
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