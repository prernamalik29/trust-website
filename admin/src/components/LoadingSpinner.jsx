import './LoadingSpinner.css';

export default function LoadingSpinner({ fullPage }) {
  if (fullPage) {
    return (
      <div className="spinner-fullpage">
        <div className="spinner"></div>
      </div>
    );
  }

  return <div className="spinner"></div>;
}
