'use client';

import { Printer } from 'lucide-react';

export default function PrintReceiptButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="btn btn-primary"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13 }}
    >
      <Printer size={15} /> PRINT / SAVE PDF
    </button>
  );
}
