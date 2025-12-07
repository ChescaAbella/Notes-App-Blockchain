import { memo } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';

const Toast = memo(({ toast }) => {
  if (!toast.show) return null;

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-icon">
        {toast.type === "success" ? <CheckCircle size={20} /> : <XCircle size={20} />}
      </div>
      <div className="toast-message">{toast.message}</div>
    </div>
  );
});

Toast.displayName = 'Toast';

export default Toast;