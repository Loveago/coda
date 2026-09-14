'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Eraser, Check, X, PenTool } from 'lucide-react';

interface DigitalSignaturePadProps {
  title?: string;
  subtitle?: string;
  signatoryRole: 'DRIVER' | 'GUARANTOR_1' | 'GUARANTOR_2' | 'AGENCY' | 'WITNESS';
  defaultName?: string;
  onSave: (signatureData: string, signatoryName: string) => Promise<void> | void;
  onCancel?: () => void;
  isSaving?: boolean;
}

export default function DigitalSignaturePad({
  title = 'Digital Signature',
  subtitle = 'Please sign within the box using your finger, stylus, or mouse',
  signatoryRole,
  defaultName = '',
  onSave,
  onCancel,
  isSaving = false
}: DigitalSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatoryName, setSignatoryName] = useState(defaultName);
  const [error, setError] = useState<string | null>(null);

  // Setup canvas resolution and styling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set resolution based on devicePixelRatio for smooth crisp lines
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#0f2744'; // Elegant navy signature ink
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      if (!touch) return { x: 0, y: 0 };
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
    setError(null);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e?: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    if (e) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    setError(null);
  };

  const handleSave = () => {
    if (!signatoryName.trim()) {
      setError('Please enter your full legal name.');
      return;
    }
    if (!hasSignature) {
      setError('Please provide your digital signature on the pad.');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl, signatoryName.trim());
  };

  return (
    <div style={{
      background: 'white',
      borderRadius: 12,
      border: '1px solid #e2e8f0',
      padding: '24px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
      maxWidth: 580,
      width: '100%',
      margin: '0 auto'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            background: 'var(--blue-light, #e0f2fe)',
            color: 'var(--blue, #0284c7)',
            padding: 8,
            borderRadius: 8
          }}>
            <PenTool size={18} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{title}</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{subtitle}</p>
          </div>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {error && (
        <div style={{
          background: '#fee2e2',
          border: '1px solid #f87171',
          color: '#991b1b',
          fontSize: 13,
          padding: '8px 12px',
          borderRadius: 6,
          marginBottom: 14
        }}>
          {error}
        </div>
      )}

      {/* Name field */}
      <div style={{ marginBottom: 14 }}>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#334155', marginBottom: 4 }}>
          Full Legal Name of Signatory:
        </label>
        <input
          type="text"
          value={signatoryName}
          onChange={(e) => setSignatoryName(e.target.value)}
          placeholder="e.g. Kwame Mensah"
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 6,
            fontSize: 14,
            outline: 'none'
          }}
        />
      </div>

      {/* Signature Canvas Box */}
      <div style={{
        position: 'relative',
        background: '#f8fafc',
        border: '2px dashed #94a3b8',
        borderRadius: 8,
        overflow: 'hidden',
        touchAction: 'none'
      }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          style={{
            display: 'block',
            width: '100%',
            height: 180,
            cursor: 'crosshair'
          }}
        />

        {/* Signature baseline guideline */}
        <div style={{
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          borderBottom: '1px solid #cbd5e1',
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ fontSize: 10, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Sign Above ({signatoryRole.replace('_', ' ')})
          </span>
          <span style={{ fontSize: 10, color: '#94a3b8' }}>✕</span>
        </div>
      </div>

      {/* Action Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingTop: 12,
        borderTop: '1px solid #f1f5f9'
      }}>
        <button
          type="button"
          onClick={clearCanvas}
          disabled={!hasSignature || isSaving}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: 'transparent',
            border: '1px solid #cbd5e1',
            color: '#64748b',
            borderRadius: 6,
            padding: '6px 12px',
            fontSize: 13,
            cursor: hasSignature ? 'pointer' : 'not-allowed',
            opacity: hasSignature ? 1 : 0.5
          }}
        >
          <Eraser size={14} /> Clear
        </button>

        <div style={{ display: 'flex', gap: 8 }}>
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              style={{
                background: '#f1f5f9',
                border: 'none',
                color: '#475569',
                borderRadius: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#0284c7',
              border: 'none',
              color: 'white',
              borderRadius: 6,
              padding: '8px 18px',
              fontSize: 13,
              fontWeight: 600,
              cursor: isSaving ? 'wait' : 'pointer'
            }}
          >
            <Check size={16} /> {isSaving ? 'Submitting...' : 'Apply Signature'}
          </button>
        </div>
      </div>
    </div>
  );
}
