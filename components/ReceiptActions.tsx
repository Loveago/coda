'use client';

import { Printer } from 'lucide-react';

export default function ReceiptActions() {
  return (
    <button className="btn btn-primary no-print" onClick={() => window.print()}>
      <Printer size={15} /> DOWNLOAD RECEIPT
    </button>
  );
}
