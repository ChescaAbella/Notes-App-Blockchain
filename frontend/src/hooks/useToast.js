import { useState } from 'react';

export function useToast() {
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 3000);
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "" });
  };

  return {
    toast,
    showToast,
    hideToast
  };
}