import Modal from './Modal';
import './ViewDetailModal.css';

function formatValue(val) {
  if (val === null || val === undefined || val === '') return <span className="vdm-empty">—</span>;
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  if (typeof val === 'object' && (val.seconds || val.toDate)) {
    const d = val.toDate ? val.toDate() : new Date(val.seconds * 1000);
    return d.toLocaleString('en-IN');
  }
  return String(val);
}

/**
 * Generic detail modal.
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {string} props.title
 * @param {Object} props.data — the record to display
 * @param {Array<{key: string, label: string}>} props.fields — which fields to render and their labels
 * @param {ReactNode} [props.footer] — optional footer actions
 */
export default function ViewDetailModal({ isOpen, onClose, title, data, fields, footer }) {
  if (!data) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="vdm-grid">
        {fields.map(({ key, label, fullWidth }) => (
          <div key={key} className={`vdm-field ${fullWidth ? 'vdm-full' : ''}`}>
            <span className="vdm-label">{label}</span>
            <span className="vdm-value">{formatValue(data[key])}</span>
          </div>
        ))}
      </div>
      {footer && <div className="vdm-footer">{footer}</div>}
    </Modal>
  );
}
