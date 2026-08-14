import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import { useToast } from '../context/ToastContext.jsx';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message = 'This action cannot be undone.', confirmText = 'Delete', loading }) {
  const toast = useToast();

  const handle = async () => {
    try {
      await onConfirm();
      onClose?.();
    } catch (e) {
      toast.error(e.message || 'Something went wrong');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Confirm action"
      size="sm"
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-danger" onClick={handle} disabled={loading}>
            {loading ? 'Please wait…' : confirmText}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-full bg-danger/10 flex items-center justify-center shrink-0">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </div>
        <div>
          <h4 className="font-semibold text-ink">{title}</h4>
          <p className="text-sm text-gray mt-1">{message}</p>
        </div>
      </div>
    </Modal>
  );
}
