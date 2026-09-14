'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Printer,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowLeft,
  ShieldCheck,
  Award,
  PenTool,
  Building2,
  User,
  Car,
  Calendar,
  DollarSign
} from 'lucide-react';
import DigitalSignaturePad from './DigitalSignaturePad';

interface LegalAgreementDocumentProps {
  agreement: any;
  isAdmin?: boolean;
  isMember?: boolean;
}

export default function LegalAgreementDocument({
  agreement,
  isAdmin = false,
  isMember = false
}: LegalAgreementDocumentProps) {
  const [signingRole, setSigningRole] = useState<'DRIVER' | 'GUARANTOR_1' | 'GUARANTOR_2' | 'AGENCY' | 'WITNESS' | null>(null);
  const [isSavingSignature, setIsSavingSignature] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const vehicle = agreement.vehicle || {};
  const application = agreement.application || {};
  const isDailySales = agreement.agreementType === 'DAILY_SALES';

  const totalPrice = Number(agreement.totalPrice || 0);
  const weeklyPayment = Number(agreement.weeklyPayment || 0);
  const depositRequired = Number(agreement.depositRequired || 0);
  const depositPaid = Number(agreement.depositPaid || 0);
  const dailySalesRate = Number(agreement.dailySalesRate || (weeklyPayment / (agreement.workingDaysPerWeek || 6)));
  const workingDays = agreement.workingDaysPerWeek || 6;

  // Guarantor Info
  const g1Name = application.guarantor1Name || 'Specified on Application File';
  const g1Phone = application.guarantor1Phone || 'N/A';
  const g1GhanaCard = application.guarantor1GhanaCard || 'N/A';
  const g1Occupation = application.guarantor1Occupation || 'N/A';
  const g1Address = application.guarantor1Address || 'N/A';

  const g2Name = application.guarantor2Name || 'Specified on Application File';
  const g2Phone = application.guarantor2Phone || 'N/A';
  const g2GhanaCard = application.guarantor2GhanaCard || 'N/A';
  const g2Occupation = application.guarantor2Occupation || 'N/A';
  const g2Address = application.guarantor2Address || 'N/A';

  const handlePrint = () => {
    window.print();
  };

  const handleSaveSignature = async (signatureData: string, signatoryName: string) => {
    if (!signingRole) return;
    setIsSavingSignature(true);
    setFeedbackMsg(null);

    try {
      let endpoint = '';
      if (isAdmin) {
        endpoint = `/api/admin/work-and-pay/agreements/${agreement.id}/signature`;
      } else {
        endpoint = `/api/member/work-and-pay/agreements/${agreement.id}/signature`;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: signingRole,
          signatureData,
          signatoryName
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save signature.');

      setFeedbackMsg({ type: 'success', text: `Signature for ${signingRole.replace('_', ' ')} saved successfully!` });
      setSigningRole(null);
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'Error recording signature.' });
    } finally {
      setIsSavingSignature(false);
    }
  };

  // Signatory status check
  const hasDriverSig = !!agreement.driverSignature;
  const hasAgencySig = !!agreement.agencySignature;
  const isFullySigned = hasDriverSig && hasAgencySig;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 20px 60px' }}>
      {/* Top Action Bar (Hidden in Print) */}
      <div className="no-print" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 12,
        background: 'white',
        padding: '16px 20px',
        borderRadius: 12,
        border: '1px solid #e2e8f0',
        marginBottom: 24,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isAdmin ? (
            <Link
              href={`/admin/work-and-pay/agreements/${agreement.id}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <ArrowLeft size={16} /> Back to Agreement
            </Link>
          ) : (
            <Link
              href="/member/work-and-pay"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#64748b',
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: 600
              }}
            >
              <ArrowLeft size={16} /> Member Dashboard
            </Link>
          )}

          <div style={{ height: 20, width: 1, background: '#e2e8f0' }} />

          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            background: isFullySigned ? '#dcfce7' : '#fef3c7',
            color: isFullySigned ? '#15803d' : '#b45309'
          }}>
            {isFullySigned ? <CheckCircle2 size={14} /> : <Clock size={14} />}
            {isFullySigned ? 'FULLY EXECUTED & SIGNED' : 'PENDING SIGNATURES'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Sign buttons */}
          {isMember && !hasDriverSig && (
            <button
              onClick={() => setSigningRole('DRIVER')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: '#0284c7',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <PenTool size={16} /> Sign as Driver
            </button>
          )}

          {isAdmin && (
            <div style={{ display: 'flex', gap: 6 }}>
              {!hasAgencySig && (
                <button
                  onClick={() => setSigningRole('AGENCY')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#0284c7',
                    color: 'white',
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Award size={16} /> Sign as Agency
                </button>
              )}

              {!hasDriverSig && (
                <button
                  onClick={() => setSigningRole('DRIVER')}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#f8fafc',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    padding: '8px 12px',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <PenTool size={14} /> Record Driver Sig
                </button>
              )}
            </div>
          )}

          <button
            onClick={handlePrint}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#0f172a',
              color: 'white',
              border: 'none',
              padding: '8px 18px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="no-print" style={{
          padding: '12px 16px',
          borderRadius: 8,
          marginBottom: 20,
          fontSize: 14,
          fontWeight: 600,
          background: feedbackMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
          color: feedbackMsg.type === 'success' ? '#15803d' : '#b91c1c',
          border: `1px solid ${feedbackMsg.type === 'success' ? '#86efac' : '#f87171'}`
        }}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Signature Modal (Hidden in Print) */}
      {signingRole && (
        <div className="no-print" style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 20
        }}>
          <DigitalSignaturePad
            title={`Capture ${signingRole.replace('_', ' ')} Signature`}
            subtitle={`Digital signing for agreement ${agreement.agreementNumber}`}
            signatoryRole={signingRole}
            defaultName={
              signingRole === 'DRIVER'
                ? agreement.driverName
                : signingRole === 'AGENCY'
                ? 'Mr Truth Agency Director'
                : signingRole === 'GUARANTOR_1'
                ? g1Name
                : signingRole === 'GUARANTOR_2'
                ? g2Name
                : ''
            }
            onSave={handleSaveSignature}
            onCancel={() => setSigningRole(null)}
            isSaving={isSavingSignature}
          />
        </div>
      )}

      {/* =========================================================================
          FORMAL PRINTABLE LEGAL CONTRACT DOCUMENT
          ========================================================================= */}
      <div id="printable-contract" className="contract-sheet" style={{
        background: '#ffffff',
        border: '1px solid #d1d5db',
        borderRadius: 4,
        padding: '50px 60px',
        color: '#111827',
        fontFamily: '"Times New Roman", Times, Georgia, serif',
        fontSize: '14.5px',
        lineHeight: 1.65,
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
      }}>

        {/* Contract Header & Official Letterhead */}
        <div style={{ textAlign: 'center', borderBottom: '3px double #1f2937', paddingBottom: 24, marginBottom: 28 }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: '#0f2744',
            color: 'white',
            marginBottom: 10
          }}>
            <ShieldCheck size={32} />
          </div>
          <h1 style={{
            margin: '0 0 4px',
            fontSize: 22,
            letterSpacing: 2,
            textTransform: 'uppercase',
            fontWeight: 800,
            color: '#0f2744'
          }}>
            MR TRUTH AGENCY (GHANA) LIMITED
          </h1>
          <p style={{ margin: 0, fontSize: 12, color: '#4b5563', fontFamily: 'system-ui, sans-serif' }}>
            Commercial Transport Logistics, Fleet Management & Vehicle Finance Division<br />
            Accra & Kumasi, Republic of Ghana · Tel: +233 (0) 54 892 2011 · Email: contact@mrtruthagency.com
          </p>
          <div style={{
            display: 'inline-block',
            marginTop: 16,
            padding: '6px 20px',
            border: '2px solid #0f2744',
            borderRadius: 4,
            background: '#f8fafc'
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 15,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: '#0f2744'
            }}>
              {isDailySales
                ? 'COMMERCIAL VEHICLE DAILY SALES OPERATIONAL AGREEMENT'
                : 'COMMERCIAL VEHICLE HIRE-PURCHASE (WORK & PAY) AGREEMENT'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 11.5, fontWeight: 600, color: '#64748b', fontFamily: 'monospace' }}>
              AGREEMENT REF: {agreement.agreementNumber}
            </p>
          </div>
        </div>

        {/* Date of Execution */}
        <p style={{ textAlign: 'justify', marginBottom: 20 }}>
          THIS AGREEMENT is made and entered into this <strong>{new Date(agreement.startDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>, by and between the parties set forth hereunder:
        </p>

        {/* Parties Box */}
        <div style={{
          border: '1px solid #cbd5e1',
          borderRadius: 4,
          padding: '16px 20px',
          background: '#fcfcfd',
          marginBottom: 24,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 13
        }}>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 12 }}>
              1. THE OWNER / MANAGEMENT COMPANY:
            </p>
            <p style={{ margin: '4px 0 0', color: '#1e293b' }}>
              <strong>MR TRUTH AGENCY (GHANA) LIMITED</strong>, a duly registered corporate transport management entity under the Companies Act of the Republic of Ghana, herein acting on its own behalf {agreement.fleetOwnerName ? `and on behalf of Fleet Investor (${agreement.fleetOwnerName})` : ''} (hereinafter referred to as the <em>&quot;OWNER&quot;</em>).
            </p>
          </div>

          <div style={{ marginBottom: 14, paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 12 }}>
              2. THE HIRER / OPERATOR (DRIVER):
            </p>
            <p style={{ margin: '4px 0 0', color: '#1e293b' }}>
              <strong>{agreement.driverName.toUpperCase()}</strong>, Holder of Ghana National Card No: <strong>{application.ghanaCardNumber || 'ON FILE'}</strong>, Driver&apos;s License No: <strong>{application.driverLicenseNumber || 'ON FILE'} (Class {application.driverLicenseClass || 'B'})</strong>, Telephone: <strong>{agreement.driverPhone}</strong>, Residential Address: {application.operatingRegion ? `${application.operatingRegion} Region, Ghana` : 'Republic of Ghana'} (hereinafter referred to as the <em>&quot;HIRER&quot;</em> or <em>&quot;OPERATOR&quot;</em>).
            </p>
          </div>

          <div style={{ paddingTop: 10, borderTop: '1px solid #e2e8f0' }}>
            <p style={{ margin: 0, fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 12 }}>
              3. THE SURETY / GUARANTORS:
            </p>
            <p style={{ margin: '4px 0 0', color: '#1e293b' }}>
              <strong>(1) {g1Name.toUpperCase()}</strong> (Ghana Card: {g1GhanaCard}, Tel: {g1Phone}, Occupation: {g1Occupation}, Address: {g1Address}) and<br />
              <strong>(2) {g2Name.toUpperCase()}</strong> (Ghana Card: {g2GhanaCard}, Tel: {g2Phone}, Occupation: {g2Occupation}, Address: {g2Address})<br />
              (hereinafter jointly and severally referred to as the <em>&quot;GUARANTORS&quot;</em>).
            </p>
          </div>
        </div>

        {/* Recitals */}
        <h3 style={{ fontSize: 14, fontWeight: 800, textTransform: 'uppercase', color: '#0f2744', margin: '24px 0 10px' }}>
          WHEREAS:
        </h3>
        <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
          A. The OWNER is the lawful possessor, manager, or titleholder of the commercial motor vehicle described in Schedule A below.
        </p>
        <p style={{ textAlign: 'justify', margin: '0 0 12px' }}>
          B. {isDailySales
            ? 'The HIRER desires to operate the vehicle under a Commercial Daily Sales arrangement, remitting an agreed daily sales quota to the OWNER while maintaining the vehicle in clean commercial roadworthy condition, without any transfer of vehicle ownership.'
            : 'The HIRER desires to take possession of the vehicle on a Hire-Purchase (Work & Pay) arrangement with the intent of obtaining full ownership and legal title of the vehicle upon complete satisfaction of all agreed financial remittances and terms.'}
        </p>
        <p style={{ textAlign: 'justify', margin: '0 0 20px' }}>
          C. The GUARANTORS agree to jointly and severally guarantee the diligent fulfillment of all covenants, remittances, and vehicle custody obligations by the HIRER.
        </p>

        {/* Schedule A: Vehicle Specifications */}
        <div style={{ margin: '20px 0 28px' }}>
          <h3 style={{
            fontSize: 13.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#0f2744',
            margin: '0 0 8px',
            fontFamily: 'system-ui, sans-serif'
          }}>
            SCHEDULE A — VEHICLE PARTICULAR SPECIFICATIONS (DVLA SCHEDULE)
          </h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12.5,
            fontFamily: 'system-ui, sans-serif'
          }}>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700, width: '22%' }}>Registration Plate No:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 800, color: '#0f2744', width: '28%' }}>
                  {vehicle.registrationNumber || 'PENDING ASSIGNMENT'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700, width: '22%' }}>Make / Model / Year:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', width: '28%' }}>
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Chassis / VIN Number:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontFamily: 'monospace' }}>
                  {vehicle.vin || 'ON FILE AT DVLA'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Vehicle Color:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {vehicle.color || 'White'}
                </td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Handover Mileage:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {vehicle.mileage ? `${Number(vehicle.mileage).toLocaleString()} KM` : 'As per Handover Sheet'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>GPS Telematics Tracking:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {vehicle.trackerInstalled ? `ACTIVE (ID: ${vehicle.trackerDeviceId || 'INSTALLED'})` : 'STANDARD FLEET GPS'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Schedule B: Financial Terms */}
        <div style={{ margin: '20px 0 28px' }}>
          <h3 style={{
            fontSize: 13.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#0f2744',
            margin: '0 0 8px',
            fontFamily: 'system-ui, sans-serif'
          }}>
            SCHEDULE B — FINANCIAL TERMS & REMITTANCE SCHEDULE
          </h3>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 12.5,
            fontFamily: 'system-ui, sans-serif'
          }}>
            <tbody>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700, width: '25%' }}>Contract Program Scheme:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 800, color: '#0f2744', width: '25%' }}>
                  {isDailySales ? 'DAILY SALES (COMMERCIAL RENTAL)' : 'WORK & PAY (HIRE-PURCHASE)'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700, width: '25%' }}>
                  {isDailySales ? 'Daily Sales Remittance Rate:' : 'Total Hire-Purchase Target:'}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 800, color: '#0f2744', width: '25%' }}>
                  {isDailySales
                    ? `GHS ${dailySalesRate.toFixed(2)} / Day`
                    : `GHS ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Security Deposit Required:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  GHS {depositRequired.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Deposit Status / Paid:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', color: depositPaid >= depositRequired ? '#16a34a' : '#ea580c', fontWeight: 700 }}>
                  GHS {depositPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({depositPaid >= depositRequired ? 'CONFIRMED' : 'BALANCE PENDING'})
                </td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Weekly Remittance Target:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>
                  GHS {weeklyPayment.toLocaleString('en-US', { minimumFractionDigits: 2 })} / Week
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Operating Schedule:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {workingDays} Days / Week (1 Rest & Maintenance Day)
                </td>
              </tr>
              <tr>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Duration & Term:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {isDailySales ? 'Renewable Commercial Contract' : `${agreement.durationWeeks} Weeks (${(agreement.durationWeeks / 52).toFixed(1)} Years)`}
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Payment Channel:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  Mr Truth Agency Paystack MoMo / Official Bank
                </td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Grace Period:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  {agreement.gracePeriodDays} Calendar Days
                </td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px', fontWeight: 700 }}>Late Remittance Penalty:</td>
                <td style={{ border: '1px solid #cbd5e1', padding: '8px 12px' }}>
                  GHS {Number(agreement.latePenaltyFee).toFixed(2)} per occurrence
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Page break for printing legal articles */}
        <div style={{ pageBreakBefore: 'always', paddingTop: 20 }}>
          <div style={{ textAlign: 'right', fontSize: 11, color: '#94a3b8', marginBottom: 16, fontFamily: 'monospace' }}>
            Agreement Ref: {agreement.agreementNumber} · Page 2
          </div>

          <h3 style={{ fontSize: 14.5, fontWeight: 800, textTransform: 'uppercase', color: '#0f2744', marginBottom: 14 }}>
            NOW IT IS HEREBY MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS FOLLOWS:
          </h3>

          <div style={{ textAlign: 'justify', fontSize: 13.5 }}>
            <p><strong>1. OWNERSHIP & RESERVATION OF TITLE:</strong><br />
              {isDailySales
                ? 'Under this Daily Sales Agreement, absolute ownership and legal title of the motor vehicle shall at all times remain solely vested in the OWNER. The HIRER is exclusively an authorized commercial operator and acquires NO equity, proprietary right, or ownership claim to the vehicle whatsoever.'
                : 'Under this Work & Pay Hire-Purchase Agreement, the motor vehicle shall remain the absolute legal property of the OWNER until the HIRER has duly paid 100% of the Total Hire-Purchase Target Price and all accrued penalty or administration fees. Upon full certified settlement, the OWNER shall execute DVLA Form C and transfer title to the HIRER.'}
            </p>

            <p><strong>2. REMITTANCES & TIMELINESS:</strong><br />
              The HIRER covenants to make payments promptly through the Agency’s official Paystack Mobile Money channel or authorized bank account every week on or before the due date. A grace period of {agreement.gracePeriodDays} days is provided. Remittances delayed beyond the grace period shall incur a late charge of GHS {Number(agreement.latePenaltyFee).toFixed(2)} and may trigger vehicle recall.
            </p>

            <p><strong>3. VEHICLE OPERATION & BOUNDARIES:</strong><br />
              The vehicle shall be operated strictly for lawful commercial ride-hailing (Uber, Bolt, Yango, or approved station taxi) within the designated {application.operatingRegion || 'Greater Accra'} Region. The HIRER shall NOT cross international borders (e.g. Togo, Ivory Coast, Burkina Faso) or transport illegal narcotics, firearms, contraband, or unregistered goods. Any illegal use shall lead to instantaneous contract termination, forfeiture of deposit, and police prosecution.
            </p>

            <p><strong>4. GPS TELEMATICS & ANTI-TAMPERING:</strong><br />
              The vehicle is fitted with an active GPS tracking device. The HIRER shall NOT tamper with, shield, disconnect, or attempt to disable the tracking hardware. Disconnection of the GPS unit is considered an immediate breach of contract and an act of criminal misappropriation, empowering the OWNER to immobilize the engine remotely and recover the vehicle immediately.
            </p>

            <p><strong>5. MAINTENANCE, REPAIRS & DVLA COMPLIANCE:</strong><br />
              The HIRER is responsible for maintaining the vehicle in clean, mechanically sound operating condition, including engine oil and filter changes every 5,000 kilometers at an authorized mechanic workshop. The OWNER shall ensure the vehicle has valid Comprehensive Insurance and DVLA Roadworthiness Certification at handover. The HIRER shall immediately report any mechanical fault, breakdown, or accident to the OWNER within 12 hours.
            </p>

            <p><strong>6. SECURITY DEPOSIT & LIQUIDATED DAMAGES:</strong><br />
              The initial Security Deposit of GHS {depositRequired.toLocaleString()} shall be held by the OWNER as caution against damage, unpaid traffic tickets, or default arrears. In the event of contract termination due to driver default or negligence, the deposit shall be applied to offset recovery expenses and repairs.
            </p>

            <p><strong>7. DEFAULT & SUMMARY REPOSSESSION:</strong><br />
              In the event that the HIRER: (a) fails to remit payment for two consecutive weeks, (b) refuses to submit the vehicle for routine inspection, (c) tampers with the GPS unit, or (d) abandons the vehicle, the OWNER reserves the absolute right to repossess the vehicle without court order or prior notice. A repossession recovery fee of GHS 1,500 shall be charged to the HIRER.
            </p>

            <p><strong>8. GUARANTOR JOINT & SEVERAL INDEMNITY:</strong><br />
              The GUARANTORS hereby jointly and severally guarantee the due performance of all obligations by the HIRER. In the event of default, vehicle abscondment, or damage, the GUARANTORS shall be personally and legally liable to pay all outstanding arrears or surrender the vehicle to the OWNER.
            </p>

            <p><strong>9. GOVERNING LAW & JURISDICTION:</strong><br />
              This Agreement is executed under and shall be governed, interpreted, and construed in accordance with the Laws of the Republic of Ghana. Any disputes shall first be resolved through amicable mediation at the Agency&apos;s Accra office.
            </p>
          </div>
        </div>

        {/* Schedule C: Signatures & Seal Section */}
        <div style={{
          marginTop: 36,
          paddingTop: 24,
          borderTop: '2px solid #0f2744',
          pageBreakInside: 'avoid'
        }}>
          <h3 style={{
            fontSize: 13.5,
            fontWeight: 800,
            textTransform: 'uppercase',
            color: '#0f2744',
            marginBottom: 20,
            textAlign: 'center',
            fontFamily: 'system-ui, sans-serif'
          }}>
            IN WITNESS WHEREOF, THE PARTIES HAVE EXECUTED THIS AGREEMENT THE DAY AND YEAR FIRST ABOVE WRITTEN
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: 28,
            fontFamily: 'system-ui, sans-serif',
            fontSize: 12.5
          }}>
            {/* Driver Signature Box */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '14px 16px',
              background: '#f8fafc'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 11.5 }}>
                SIGNED BY THE HIRER (DRIVER):
              </p>
              <div style={{
                height: 70,
                borderBottom: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                marginBottom: 8
              }}>
                {agreement.driverSignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agreement.driverSignature}
                    alt="Driver Signature"
                    style={{ maxHeight: 60, maxWidth: '90%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                    Pending Digital Signature
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0', fontWeight: 700, color: '#0f172a' }}>
                Name: {agreement.driverSignedName || agreement.driverName}
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Ghana Card: {application.ghanaCardNumber || 'VERIFIED ON FILE'}
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Date Signed: {agreement.driverSignedAt ? new Date(agreement.driverSignedAt).toLocaleString('en-GB') : 'Unsigned'}
              </p>
            </div>

            {/* Agency Signature Box */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '14px 16px',
              background: '#f8fafc',
              position: 'relative'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 11.5 }}>
                SIGNED FOR & ON BEHALF OF MR TRUTH AGENCY:
              </p>
              <div style={{
                height: 70,
                borderBottom: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                marginBottom: 8
              }}>
                {agreement.agencySignature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agreement.agencySignature}
                    alt="Agency Seal & Signature"
                    style={{ maxHeight: 60, maxWidth: '90%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                    Pending Agency Signature & Seal
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0', fontWeight: 700, color: '#0f172a' }}>
                Authorized Officer: {agreement.agencySignedBy || 'Managing Director'}
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Title: Director of Fleet Operations & Finance
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Date: {agreement.agencySignedAt ? new Date(agreement.agencySignedAt).toLocaleString('en-GB') : 'Unsigned'}
              </p>

              {/* Agency Official Seal Badge */}
              <div style={{
                position: 'absolute',
                bottom: 12,
                right: 14,
                width: 50,
                height: 50,
                border: '2px dashed #0284c7',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0284c7',
                fontSize: 9,
                fontWeight: 800,
                textTransform: 'uppercase',
                transform: 'rotate(-12deg)',
                pointerEvents: 'none',
                opacity: agreement.agencySignature ? 0.9 : 0.3
              }}>
                OFFICIAL SEAL
              </div>
            </div>

            {/* Guarantor 1 Signature Box */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '14px 16px',
              background: '#f8fafc'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 11.5 }}>
                SIGNED BY 1ST GUARANTOR:
              </p>
              <div style={{
                height: 70,
                borderBottom: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                marginBottom: 8
              }}>
                {agreement.guarantor1Signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agreement.guarantor1Signature}
                    alt="Guarantor 1 Signature"
                    style={{ maxHeight: 60, maxWidth: '90%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                    Signed via Guarantor Form / Digital
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0', fontWeight: 700, color: '#0f172a' }}>
                Name: {agreement.guarantor1SignedName || g1Name}
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Ghana Card: {g1GhanaCard} · Tel: {g1Phone}
              </p>
            </div>

            {/* Guarantor 2 Signature Box */}
            <div style={{
              border: '1px solid #cbd5e1',
              borderRadius: 6,
              padding: '14px 16px',
              background: '#f8fafc'
            }}>
              <p style={{ margin: '0 0 8px', fontWeight: 700, color: '#0f2744', textTransform: 'uppercase', fontSize: 11.5 }}>
                SIGNED BY 2ND GUARANTOR:
              </p>
              <div style={{
                height: 70,
                borderBottom: '2px solid #334155',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'white',
                marginBottom: 8
              }}>
                {agreement.guarantor2Signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={agreement.guarantor2Signature}
                    alt="Guarantor 2 Signature"
                    style={{ maxHeight: 60, maxWidth: '90%', objectFit: 'contain' }}
                  />
                ) : (
                  <span style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: 12 }}>
                    Signed via Guarantor Form / Digital
                  </span>
                )}
              </div>
              <p style={{ margin: '2px 0', fontWeight: 700, color: '#0f172a' }}>
                Name: {agreement.guarantor2SignedName || g2Name}
              </p>
              <p style={{ margin: '2px 0', color: '#64748b', fontSize: 11 }}>
                Ghana Card: {g2GhanaCard} · Tel: {g2Phone}
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Print-specific CSS styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
            font-size: 13pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, footer, nav, aside, .no-print, .admin-sidebar, .mshell > nav, .btn {
            display: none !important;
          }
          .mcontent, main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }
          .contract-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
