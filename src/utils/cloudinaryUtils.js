// Cloudinary configuration and upload utilities
const CLOUDINARY_CLOUD_NAME = 'dosewtgjx';
const CLOUDINARY_API_KEY = '113488133623828';
const CLOUDINARY_API_SECRET = 'NnWPGjkoP5f0vhuzrUlQzlvUJDs';

/**
 * Generate SHA-1 signature for Cloudinary upload
 * @param {Object} params - Upload parameters
 * @param {string} apiSecret - Cloudinary API secret
 * @returns {Promise<string>} - Generated signature
 */
const generateSignature = async (params, apiSecret) => {
  // Sort parameters alphabetically and create query string
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  const stringToSign = sortedParams + apiSecret;
  
  // Use Web Crypto API to generate SHA-1 hash
  const encoder = new TextEncoder();
  const data = encoder.encode(stringToSign);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  
  return hashHex;
};

/**
 * Upload image to Cloudinary using signed upload
 * @param {File} file - The image file to upload
 * @returns {Promise<string>} - Promise that resolves to the Cloudinary image URL
 */
export const uploadImageToCloudinary = async (file) => {
  if (!file) {
    throw new Error('No file provided');
  }

  // Validate file type
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  // Validate file size (max 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB in bytes
  if (file.size > maxSize) {
    throw new Error('File size must be less than 10MB');
  }

  try {
    // Prepare upload parameters
    const timestamp = Math.round(new Date().getTime() / 1000);
    const uploadParams = {
      timestamp: timestamp,
      folder: 'quiz_images'
    };

    // Generate signature
    const signature = await generateSignature(uploadParams, CLOUDINARY_API_SECRET);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp);
    formData.append('folder', 'quiz_images');
    formData.append('signature', signature);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData,
      }
    );

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} - ${data.error?.message || 'Unknown error'}`);
    }

    return data.secure_url;
  } catch (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

/**
 * Get optimized Cloudinary URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} - Optimized Cloudinary URL
 */
export const getOptimizedCloudinaryUrl = (publicId, options = {}) => {
  const {
    width = 800,
    height = 600,
    quality = 'auto',
    format = 'auto',
    crop = 'fill'
  } = options;

  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/w_${width},h_${height},c_${crop},q_${quality},f_${format}/${publicId}`;
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary URL
 * @returns {string} - Public ID
 */
export const extractPublicIdFromUrl = (url) => {
  if (!url || !url.includes('cloudinary.com')) {
    return null;
  }

  const parts = url.split('/');
  const uploadIndex = parts.findIndex(part => part === 'upload');
  if (uploadIndex === -1) return null;

  // Get everything after 'upload' and any transformations
  const afterUpload = parts.slice(uploadIndex + 1);
  
  // Remove transformation parameters (they start with letters like w_, h_, etc.)
  const publicIdParts = afterUpload.filter(part => 
    !part.includes('_') || !part.match(/^[a-z]_/)
  );

  return publicIdParts.join('/').replace(/\.[^/.]+$/, ''); // Remove file extension
};