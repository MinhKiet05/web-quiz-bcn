/**
 * Utility functions for image URL processing
 */

/**
 * Chuyển đổi Google Drive URL thành direct download link
 * @param {string} url - URL gốc
 * @returns {string} - Direct download URL
 */
export const convertGoogleDriveUrl = (url) => {
  if (!url) return '';
  
  // Pattern cho Google Drive sharing URL
  const drivePattern = /https:\/\/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/;
  const match = url.match(drivePattern);
  
  if (match) {
    const fileId = match[1];
    // Sắp xếp URLs theo độ tin cậy - URLs thường hoạt động tốt nhất trước
    return [
      // Format tin cậy nhất - thường hoạt động ngay
      `https://drive.google.com/uc?export=view&id=${fileId}`,
      `https://lh3.googleusercontent.com/d/${fileId}=w1000`,
      // Backup formats với kích thước khác nhau
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1000`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`,
      // Alternative endpoints
      `https://docs.google.com/uc?export=view&id=${fileId}`,
      `https://drive.google.com/uc?id=${fileId}&export=download`,
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`
    ];
  }
  
  return [url];
};

/**
 * Tạo danh sách các URL thay thế để thử load ảnh
 * @param {string} originalUrl - URL gốc
 * @returns {string[]} - Mảng các URL để thử
 */
export const getAlternativeUrls = (originalUrl) => {
  if (!originalUrl) return [''];
  
  const urls = [originalUrl];
  
  // Nếu là Google Drive URL, thêm các format khác nhau
  if (isGoogleDriveUrl(originalUrl)) {
    const driveUrls = convertGoogleDriveUrl(originalUrl);
    if (Array.isArray(driveUrls)) {
      urls.push(...driveUrls.filter(url => url !== originalUrl));
    }
  }
  
  return [...new Set(urls)]; // Remove duplicates
};

/**
 * Kiểm tra xem URL có phải là Google Drive không
 * @param {string} url - URL để kiểm tra
 * @returns {boolean}
 */
export const isGoogleDriveUrl = (url) => {
  if (!url) return false;
  return url.includes('drive.google.com');
};

/**
 * Tạo placeholder URL khi không có ảnh
 * @param {number} width - Chiều rộng
 * @param {number} height - Chiều cao
 * @param {string} text - Text hiển thị
 * @returns {string} - Placeholder URL
 */
export const createPlaceholder = (width = 300, height = 200, text = 'No Image') => {
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${width}' height='${height}' viewBox='0 0 ${width} ${height}'%3E%3Crect width='100%25' height='100%25' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='14' fill='%23999'%3E${encodeURIComponent(text)}%3C/text%3E%3C/svg%3E`;
};
