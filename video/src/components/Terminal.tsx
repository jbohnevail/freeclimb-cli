import React from 'react';
import { BRAND } from '../lib/colors';

const TRAFFIC_LIGHTS = [
  { color: '#ff5f57', border: '#e0443e' },
  { color: '#febc2e', border: '#dea123' },
  { color: '#28c840', border: '#1aab29' },
];

export const Terminal: React.FC<{ children: React.ReactNode; title?: string }> = ({
  children,
  title = 'freeclimb — bash',
}) => {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#0a0e14',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 1840,
          height: '100%',
          borderRadius: 12,
          overflow: 'hidden',
          border: `1px solid ${BRAND.border}`,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            backgroundColor: BRAND.termSurface,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            borderBottom: `1px solid ${BRAND.border}`,
          }}
        >
          <div style={{ display: 'flex', gap: 8 }}>
            {TRAFFIC_LIGHTS.map((light, i) => (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: light.color,
                  border: `1px solid ${light.border}`,
                }}
              />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              textAlign: 'center',
              color: BRAND.dimText,
              fontSize: 13,
              fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace',
            }}
          >
            {title}
          </div>
          <div style={{ width: 52 }} />
        </div>

        {/* Terminal body */}
        <div
          style={{
            flex: 1,
            backgroundColor: BRAND.termBg,
            padding: '20px 24px',
            fontFamily: 'JetBrains Mono, SF Mono, Menlo, monospace',
            fontSize: 15,
            lineHeight: 1.6,
            color: BRAND.text,
            overflow: 'hidden',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
