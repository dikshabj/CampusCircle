import { useEffect } from 'react';

function Toast({ message, type = 'info', onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`toast toast-${type}`}>
            <div style={{ flex: 1 }}>{message}</div>
            <button 
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
            >
                ✕
            </button>
        </div>
    );
}

export default Toast;
