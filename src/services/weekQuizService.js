import { doc, setDoc, getDoc, updateDoc, getDocs, collection } from 'firebase/firestore';
import { db } from '../config/firebase.js';

const COLLECTION_NAME = 'Quiz';

/**
 * Lấy danh sách tất cả các week
 * @returns {Promise<Array>} - Mảng các week
 */
export const getAllWeeks = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const weeks = [];
    
    querySnapshot.forEach((doc) => {
      weeks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    console.log('Fetched weeks:', weeks.length);
    return weeks;
  } catch (error) {
    console.error('Error getting weeks: ', error);
    throw error;
  }
};

/**
 * Lấy thông tin của một week
 * @param {string} weekId - ID của week
 * @returns {Promise<Object|null>} - Week data hoặc null
 */
export const getWeekById = async (weekId) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      console.log('No such week!');
      return null;
    }
  } catch (error) {
    console.error('Error getting week: ', error);
    throw error;
  }
};

/**
 * Thêm quiz mới vào một week
 * @param {string} weekId - ID của week
 * @param {string} quizId - ID của quiz (Quiz1, Quiz2, etc.)
 * @param {Object} quizData - Dữ liệu quiz
 * @returns {Promise<void>}
 */
export const addQuizToWeek = async (weekId, quizId, quizData) => {
  try {
    const docRef = doc(db, COLLECTION_NAME, weekId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      // Week đã tồn tại, thêm quiz mới
      await updateDoc(docRef, {
        [quizId]: quizData
      });
    } else {
      // Week chưa tồn tại, tạo mới với quiz đầu tiên
      await setDoc(docRef, {
        [quizId]: quizData
      });
    }
    
    console.log(`Quiz ${quizId} added to week ${weekId} successfully`);
  } catch (error) {
    console.error('Error adding quiz to week: ', error);
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
    await updateDoc(docRef, {
      [quizId]: quizData
    });
    
    console.log(`Quiz ${quizId} in week ${weekId} updated successfully`);
  } catch (error) {
    console.error('Error updating quiz in week: ', error);
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
    
    console.log(`Quiz ${quizId} deleted from week ${weekId} successfully`);
  } catch (error) {
    console.error('Error deleting quiz from week: ', error);
    throw error;
  }
};
