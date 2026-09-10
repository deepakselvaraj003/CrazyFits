import { useEffect } from 'react';
import { MdClose } from 'react-icons/md';

const widthMap = {
  '400px': 'max-w-[400px]',
  '600px': 'max-w-[640px]',
  '640px': 'max-w-[640px]',
  '900px': 'max-w-[900px]',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  width = '640px',
}) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const widthClass = widthMap[width] ?? 'max-w-3xl';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-dark/30 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={`w-full ${widthClass} max-h-[90vh] overflow-hidden rounded-[28px] border border-border bg-background shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-5">
          <h2 className="text-xl font-bold text-dark font-heading">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-secondary transition-colors duration-200 hover:border-primary hover:text-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
            aria-label="Close modal"
          >
            <MdClose size={22} />
          </button>
        </div>

        <div className="max-h-[calc(90vh-92px)] overflow-y-auto px-6 py-6 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Modal;
