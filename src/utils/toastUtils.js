// Global toast function
let globalAddToast = null;

export const setToastFunction = (addToastFn) => {
  globalAddToast = addToastFn;
};

export const showToast = (message, type = 'success', duration = 3000) => {
  if (globalAddToast) {
    return globalAddToast(message, type, duration);
  } else {
    console.warn('Toast system not initialized');
    // Fallback to alert for now
    alert(message);
  }
};