import { doc, setDoc, getDoc, updateDoc, getDocs, collection, deleteField } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'Quiz';

/**
 * Helper function để clean quiz data, loại bỏ startTime/endTime nếu có
 * @param {Object} quizData - Dữ liệu quiz
 * @returns {Object} - Quiz data đã được clean
 */
const cleanQuizData = (quizData) => {
  return {
    dapAnDung: quizData.dapAnDung,
    giaiThich: quizData.giaiThich,
    link: quizData.link,
    soDapAn: quizData.soDapAn
  };
};

/**
 * Lấy danh sách tất cả các week (chỉ ID và thời gian) - cho dropdown
 * @returns {Promise<Array>} - Mảng các week với thông tin cơ bản
 */
export const getAllWeeks = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const weeks = [];
  
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    weeks.push({
      id: doc.id,
      startTime: data.startTime,
      endTime: data.endTime
    });
  });
  
  return weeks;
};

/**
 * Lấy toàn bộ dữ liệu tất cả các week (bao gồm quiz data) - cho QuizzList
 * @returns {Promise<Array>} - Mảng các week với toàn bộ dữ liệu
 */
export const getAllWeeksWithQuizData = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const weeks = [];
  
  querySnapshot.forEach((doc) => {
    weeks.push({
      id: doc.id,
      ...doc.data()
    });
  });
  
  return weeks;
};

/**
 * Lấy danh sách tên week có sẵn (tối ưu - chỉ lấy ID)
 * @returns {Promise<Array>} - Mảng tên các week
 */
export const getAvailableWeekNames = async () => {
  const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
  const weekNames = [];
  
  querySnapshot.forEach((doc) => {
    weekNames.push(doc.id);
  });
  
  return weekNames.sort(); // Sắp xếp theo tên
};

/**
 * Lấy thông tin của một week
 * @param {string} weekId - ID của week
 * @returns {Promise<Object|null>} - Week data hoặc null
 */
export const getWeekById = async (weekId) => {
  const docRef = doc(db, COLLECTION_NAME, weekId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() };
  } else {
    return null;
  }
};

/**
 * Thêm quiz mới vào một week
 * @param {string} weekId - ID của week
 * @param {string} quizId - ID của quiz (Quiz1, Quiz2, etc.)
 * @param {Object} quizData - Dữ liệu quiz
 * @param {Date} startTime - Thời gian bắt đầu (chỉ dùng khi tạo week mới)
 * @param {Date} endTime - Thời gian kết thúc (chỉ dùng khi tạo week mới)
 * @returns {Promise<void>}
 */
export const addQuizToWeek = async (weekId, quizId, quizData, startTime = null, endTime = null) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Week đã tồn tại, chỉ thêm quiz mới (giữ nguyên startTime, endTime)
      // Đảm bảo quiz data KHÔNG chứa startTime, endTime
      await updateDoc(docRef, {
        [quizId]: cleanQuizData(quizData)
      });
    } else {
      // Week chưa tồn tại, tạo mới với quiz đầu tiên + startTime, endTime
      if (!startTime || !endTime || !(startTime instanceof Date) || !(endTime instanceof Date) || isNaN(startTime) || isNaN(endTime)) {
        throw new Error('startTime and endTime must be valid Date objects when creating a new week');
      }
      
      // Đảm bảo quiz data KHÔNG chứa startTime, endTime
      await setDoc(docRef, {
        startTime: startTime,
        endTime: endTime,
        [quizId]: cleanQuizData(quizData)
      });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật quiz trong một week
 * @param {string} weekId - ID của week
 * @param {string} quizId - ID của quiz
 * @param {Object} quizData - Dữ liệu quiz mới
 * @returns {Promise<void>}
 */
export const updateQuizInWeek = async (weekId, quizId, quizData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    
    // Nếu quizData là null, xóa quiz field
    if (quizData === null) {
      await updateDoc(docRef, {
        [quizId]: deleteField()
      });
    } else {
      // Đảm bảo quiz data KHÔNG chứa startTime, endTime
      await updateDoc(docRef, {
        [quizId]: cleanQuizData(quizData)
      });
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật thời gian bắt đầu và kết thúc của week
 * @param {string} weekId - ID của week
 * @param {Date} startTime - Thời gian bắt đầu
 * @param {Date} endTime - Thời gian kết thúc
 * @returns {Promise<void>}
 */
export const updateWeekTimes = async (weekId, startTime, endTime) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    await updateDoc(docRef, {
      startTime: startTime,
      endTime: endTime
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Function để clean up dữ liệu cũ bị lỗi cấu trúc
 * Loại bỏ startTime, endTime khỏi các Quiz và đưa lên cấp document
 * @param {string} weekId - ID của week cần clean
 * @returns {Promise<void>}
 */
export const cleanupWeekStructure = async (weekId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error(`Week ${weekId} does not exist`);
    }
    
    const data = docSnap.data();
    const quizKeys = Object.keys(data).filter(key => key.startsWith('Quiz'));
    
    let documentStartTime = data.startTime;
    let documentEndTime = data.endTime;
    
    // Tìm startTime, endTime từ quiz đầu tiên nếu document chưa có
    if (!documentStartTime || !documentEndTime) {
      for (const quizKey of quizKeys) {
        const quiz = data[quizKey];
        if (quiz.startTime && !documentStartTime) {
          documentStartTime = quiz.startTime;
        }
        if (quiz.endTime && !documentEndTime) {
          documentEndTime = quiz.endTime;
        }
      }
    }
    
    // Tạo object mới với cấu trúc đúng
    const cleanedData = {
      startTime: documentStartTime,
      endTime: documentEndTime
    };
    
    // Thêm các quiz đã được clean
    quizKeys.forEach(quizKey => {
      cleanedData[quizKey] = cleanQuizData(data[quizKey]);
    });
    
    // Ghi đè document với cấu trúc mới
    await setDoc(docRef, cleanedData);
  } catch (error) {
    throw error;
  }
};

/**
 * Xóa quiz khỏi một week
 * @param {string} weekId - ID của week
 * @param {string} quizId - ID của quiz
 * @returns {Promise<void>}
 */
export const deleteQuizFromWeek = async (weekId, quizId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    await updateDoc(docRef, {
      [quizId]: null // Xóa field
    });
  } catch (error) {
    throw error;
  }
};

/**
 * Lấy danh sách quiz của một tuần
 * @param {string} weekId - ID của week (vd: 'week1', 'week2')
 * @returns {Promise<Array>} - Mảng các quiz đã được format
 */
export const getQuizzesByWeek = async (weekId) => {
  try {
    const weekData = await getWeekById(weekId);
    if (!weekData) {
      return [];
    }

    const quizzes = [];
    const quizKeys = Object.keys(weekData).filter(key => key.startsWith('Quiz'));
    
    quizKeys.forEach(quizKey => {
      const quizNumber = quizKey.replace('Quiz', '');
      const quizData = weekData[quizKey];
      
      // Format quiz data để tương thích với QuizHistoryCard
      const formattedQuiz = {
        quizNumber: parseInt(quizNumber),
        question: quizData.link || 'Câu hỏi không có nội dung',
        optionA: quizData.soDapAn && quizData.soDapAn.A ? quizData.soDapAn.A : '',
        optionB: quizData.soDapAn && quizData.soDapAn.B ? quizData.soDapAn.B : '',
        optionC: quizData.soDapAn && quizData.soDapAn.C ? quizData.soDapAn.C : '',
        optionD: quizData.soDapAn && quizData.soDapAn.D ? quizData.soDapAn.D : '',
        correctAnswer: quizData.dapAnDung,
        explanation: quizData.giaiThich || '',
        imageUrl: quizData.imageUrl || '',
        startTime: weekData.startTime,
        endTime: weekData.endTime
      };
      
      quizzes.push(formattedQuiz);
    });
    
    // Sắp xếp theo quizNumber
    quizzes.sort((a, b) => a.quizNumber - b.quizNumber);
    
    return quizzes;
  } catch (error) {
    throw error;
  }
};
