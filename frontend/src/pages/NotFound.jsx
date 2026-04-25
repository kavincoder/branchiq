import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      gap: 16,
      textAlign: 'center',
      padding: '40px 24px',
    }}>
      <div style={{
        fontSize: 96,
        fontWeight: 800,
        color: 'var(--navy)',
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1,
        letterSpacing: '-4px',
      }}>
        404
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text-1)', marginTop: 8 }}>
        Page not found
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-muted)', maxWidth: 340, lineHeight: 1.6 }}>
        The URL you entered doesn't exist in BranchIQ. Check for typos or navigate using the links below.
      </div>
      <Link
        to="/dashboard"
        style={{
          marginTop: 16,
          padding: '10px 24px',
          background: 'var(--navy)',
          color: '#fff',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 14,
          textDecoration: 'none',
        }}
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
}
