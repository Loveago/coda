'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CarFront,
  Check,
  CheckCircle2,
  Copy,
  FileCheck2,
  FileText,
  KeyRound,
  Loader2,
  Shield,
  Upload,
  User,
  Users
} from 'lucide-react';

const labelStyle = {
  fontSize: 11.5,
  fontWeight: 700,
  color: 'var(--muted)',
  display: 'block',
  marginBottom: 5,
  letterSpacing: '.4px'
};

const optional = <span className="opt-badge">OPTIONAL</span>;

export default function WorkPayApplicationWizard({ initialVehicle }: { initialVehicle?: string }) {
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ applicationNumber: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Form State across steps
  const [formData, setFormData] = useState({
    // Step 1: Personal
    fullName: '',
    phone: '',
    email: '',
    ghanaCardNumber: '',
    dateOfBirth: '',
    gender: 'Male',
    residenceAddress: '',
    // Step 2: License & Experience
    driverLicenseNumber: '',
    driverLicenseClass: 'Class B',
    driverLicenseExpiry: '',
    yearsExperience: '3',
    commercialHistory: 'Bolt, Uber, Local Taxi',
    rideHailingPlatforms: '',
    // Step 3: Vehicle & Region
    preferredVehicleType: initialVehicle || 'Toyota Vitz (Compact Hatchback)',
    operatingRegion: 'Greater Accra',
    // Step 4: Guarantors
    guarantor1Name: '',
    guarantor1Phone: '',
    guarantor1Occupation: '',
    guarantor1Address: '',
    guarantor1GhanaCard: '',
    guarantor2Name: '',
    guarantor2Phone: '',
    guarantor2Occupation: '',
    guarantor2Address: '',
    guarantor2GhanaCard: '',
    // Step 5: Docs
    driverLicenseFrontUrl: '',
    driverLicenseBackUrl: '',
    ghanaCardFrontUrl: '',
    proofOfResidenceUrl: '',
    utilityBillUrl: '',
    // Step 6: Consent
    consent: false
  });

  function update(field: string, value: any) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function validateStep(current: number): boolean {
    setError(null);
    if (current === 1) {
      if (!formData.fullName.trim() || formData.fullName.length < 3) {
        setError('Please enter your full legal name.');
        return false;
      }
      if (!formData.phone.trim() || formData.phone.length < 7) {
        setError('Please enter a valid phone number.');
        return false;
      }
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setError('Please enter a valid email address.');
        return false;
      }
      if (!/^GHC-?\d{9}-?\d$/i.test(formData.ghanaCardNumber.trim())) {
        setError('Ghana Card must match pattern GHC-123456789-0.');
        return false;
      }
      if (!formData.dateOfBirth) {
        setError('Please provide your date of birth.');
        return false;
      }
    } else if (current === 2) {
      if (!formData.driverLicenseNumber.trim()) {
        setError('Driver license number is required.');
        return false;
      }
      if (!formData.yearsExperience || Number(formData.yearsExperience) < 1) {
        setError('Minimum 1 year commercial driving experience required.');
        return false;
      }
    } else if (current === 3) {
      if (!formData.preferredVehicleType) {
        setError('Please select your preferred vehicle model.');
        return false;
      }
      if (!formData.operatingRegion) {
        setError('Please specify your primary operating region.');
        return false;
      }
    } else if (current === 4) {
      if (!formData.guarantor1Name.trim() || !formData.guarantor1Phone.trim() || !formData.guarantor1GhanaCard.trim()) {
        setError('Please complete all required details for Guarantor 1.');
        return false;
      }
      if (!formData.guarantor2Name.trim() || !formData.guarantor2Phone.trim() || !formData.guarantor2GhanaCard.trim()) {
        setError('Please complete all required details for Guarantor 2.');
        return false;
      }
    } else if (current === 5) {
      // Document upload step: URL stubs or mock filenames accepted
      return true;
    }
    return true;
  }

  function nextStep() {
    if (validateStep(step)) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 120, behavior: 'smooth' });
    }
  }

  function prevStep() {
    setError(null);
    setStep((s) => s - 1);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!formData.consent) {
      setError('You must confirm and certify the accuracy of your application details.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/work-and-pay/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit application.');

      setResult({ applicationNumber: data.applicationNumber });
    } catch (err: any) {
      setError(err.message || 'Submission failed. Please check your inputs.');
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="panel" style={{ maxWidth: 680, margin: '0 auto', textAlign: 'center', padding: '40px 24px', display: 'grid', gap: 16 }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <CheckCircle2 size={36} />
        </div>
        <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>Application Received! 🚗</h2>
        <p style={{ color: 'var(--muted)', fontSize: 13.5, lineHeight: 1.6, margin: 0, maxWidth: 540, justifySelf: 'center' }}>
          Your Work &amp; Pay vehicle ownership application has been entered into our vetting queue. Our driver evaluation team will review your credentials within 48 business hours.
        </p>

        {/* Tracking Code Box */}
        <div style={{ background: '#f8fafc', border: '1px dashed var(--blue)', borderRadius: 12, padding: '18px 24px', display: 'inline-block', margin: '10px auto' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '1px', display: 'block', marginBottom: 4 }}>
            YOUR APPLICATION REFERENCE CODE
          </span>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
            <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--blue)', letterSpacing: '1px' }}>
              {result.applicationNumber}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(result.applicationNumber);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="btn btn-ghost"
              style={{ padding: '6px 10px', fontSize: 11 }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'COPIED' : 'COPY'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'left', background: '#eff6ff', borderRadius: 10, padding: 18, border: '1px solid #bfdbfe', fontSize: 12.5, color: '#1e3a8a', lineHeight: 1.6 }}>
          <strong>Next Steps in Your Ownership Journey:</strong>
          <ol style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            <li>Our recruitment officer will call you to schedule your in-person driving assessment.</li>
            <li>Guarantor contacts will receive a brief verification check.</li>
            <li>Upon passing the assessment, contract review and vehicle handover are arranged at our office.</li>
          </ol>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginTop: 10 }}>
          <Link href={`/work-and-pay/track?q=${result.applicationNumber}`} className="btn btn-primary">
            TRACK STATUS LIVE →
          </Link>
          <Link href="/work-and-pay" className="btn btn-ghost">
            RETURN TO PROGRAM OVERVIEW
          </Link>
        </div>
      </div>
    );
  }

  const stepTitles = [
    'Personal & National ID',
    'Driving Credentials',
    'Vehicle Preference',
    'Guarantor Details',
    'Document Uploads',
    'Review & Sign'
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto' }}>
      {/* Wizard Progress Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 28 }}>
        {stepTitles.map((title, i) => {
          const num = i + 1;
          const isDone = num < step;
          const isCurrent = num === step;
          return (
            <div key={num} style={{ textAlign: 'center' }}>
              <div
                style={{
                  height: 4,
                  borderRadius: 2,
                  background: isDone ? '#10b981' : isCurrent ? 'var(--blue)' : 'var(--line)',
                  marginBottom: 6,
                  transition: 'background .2s'
                }}
              />
              <span style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? 'var(--blue)' : 'var(--muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {num}. {title}
              </span>
            </div>
          );
        })}
      </div>

      <div className="panel" style={{ padding: 28 }}>
        {error && (
          <div style={{ padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 13, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--blue)', letterSpacing: '1px' }}>
            STEP {step} OF 6
          </span>
          <h2 style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 800 }}>{stepTitles[step - 1]}</h2>
        </div>

        {/* STEP 1: Personal & Ghana Card */}
        {step === 1 && (
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Full Legal Name (as on Ghana Card) *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => update('fullName', e.target.value)}
                placeholder="e.g. Kwame Mensah Osei"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Phone Number *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => update('phone', e.target.value)}
                placeholder="e.g. +233 24 123 4567"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="e.g. kwame@example.com"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Ghana Card (National ID) *</label>
              <input
                type="text"
                required
                value={formData.ghanaCardNumber}
                onChange={(e) => update('ghanaCardNumber', e.target.value.toUpperCase())}
                placeholder="GHC-123456789-0"
                maxLength={15}
                className="field"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Date of Birth *</label>
              <input
                type="date"
                required
                value={formData.dateOfBirth}
                onChange={(e) => update('dateOfBirth', e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Gender *</label>
              <select
                value={formData.gender}
                onChange={(e) => update('gender', e.target.value)}
                className="field"
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Residential Location *</label>
              <input
                type="text"
                required
                value={formData.residenceAddress}
                onChange={(e) => update('residenceAddress', e.target.value)}
                placeholder="e.g. Lapaz / Achimota, Accra"
                className="field"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Driver's License & Experience */}
        {step === 2 && (
          <div className="form-grid">
            <div>
              <label style={labelStyle}>Driver License Number *</label>
              <input
                type="text"
                required
                value={formData.driverLicenseNumber}
                onChange={(e) => update('driverLicenseNumber', e.target.value.toUpperCase())}
                placeholder="e.g. GHA-90876-21"
                className="field"
                style={{ textTransform: 'uppercase' }}
              />
            </div>
            <div>
              <label style={labelStyle}>Driver License Class *</label>
              <select
                value={formData.driverLicenseClass}
                onChange={(e) => update('driverLicenseClass', e.target.value)}
                className="field"
              >
                <option>Class B (Private & Commercial Light)</option>
                <option>Class C (Commercial Passenger)</option>
                <option>Class D (Heavy Commercial)</option>
                <option>Class F</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>License Expiration Date</label>
              <input
                type="date"
                value={formData.driverLicenseExpiry}
                onChange={(e) => update('driverLicenseExpiry', e.target.value)}
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Years of Driving Experience *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={formData.yearsExperience}
                onChange={(e) => update('yearsExperience', e.target.value)}
                className="field"
              />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Commercial Platforms / Taxi Experience *</label>
              <input
                type="text"
                value={formData.commercialHistory}
                onChange={(e) => update('commercialHistory', e.target.value)}
                placeholder="e.g. 3 years driving Bolt & Uber; 4.88 driver rating"
                className="field"
              />
              <small style={{ color: 'var(--muted)', fontSize: 11, display: 'block', marginTop: 4 }}>
                Include any platforms driven on (Bolt, Uber, Yango), stations operated from, or fleet driving experience.
              </small>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Ride-Hailing Profile URLs / Rating Screenshots {optional}</label>
              <input
                type="text"
                value={formData.rideHailingPlatforms}
                onChange={(e) => update('rideHailingPlatforms', e.target.value)}
                placeholder="e.g. Bolt Driver Rating: 4.92 (5,200 trips completed)"
                className="field"
              />
            </div>
          </div>
        )}

        {/* STEP 3: Vehicle Preference & Location */}
        {step === 3 && (
          <div className="form-grid">
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Select Preferred Vehicle Model *</label>
              <select
                value={formData.preferredVehicleType}
                onChange={(e) => update('preferredVehicleType', e.target.value)}
                className="field"
                style={{ fontWeight: 600 }}
              >
                <option>Toyota Vitz (Compact Hatchback) — Best for Bolt/Uber Eco</option>
                <option>Toyota Yaris Sedan / Belta — Best for Comfort & City</option>
                <option>Hyundai i10 Grand — High fuel economy hatchback</option>
                <option>Suzuki Swift Dzire — Compact sedan</option>
                <option>Toyota Corolla — Executive sedan / Corporate</option>
                <option>Commercial Minibus (Urvan / HiAce)</option>
                <option>Delivery Van / Cargo</option>
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Primary Operating Region *</label>
              <select
                value={formData.operatingRegion}
                onChange={(e) => update('operatingRegion', e.target.value)}
                className="field"
              >
                <option>Greater Accra Region (Accra, Tema, Kasoa, Madina)</option>
                <option>Ashanti Region (Kumasi & surrounding)</option>
                <option>Central Region (Cape Coast / Kasoa)</option>
                <option>Western Region (Sekondi-Takoradi)</option>
                <option>Eastern Region (Koforidua / Nsawam)</option>
              </select>
            </div>
          </div>
        )}

        {/* STEP 4: Guarantor Information */}
        {step === 4 && (
          <div style={{ display: 'grid', gap: 20 }}>
            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)' }}>
              <strong style={{ fontSize: 13, color: 'var(--blue)', display: 'block', marginBottom: 12 }}>
                GUARANTOR 1 (Primary)
              </strong>
              <div className="form-grid">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor1Name}
                    onChange={(e) => update('guarantor1Name', e.target.value)}
                    placeholder="e.g. Samuel K. Boakye"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.guarantor1Phone}
                    onChange={(e) => update('guarantor1Phone', e.target.value)}
                    placeholder="+233 24 555 0192"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Occupation / Employer *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor1Occupation}
                    onChange={(e) => update('guarantor1Occupation', e.target.value)}
                    placeholder="e.g. Civil Servant / Teacher"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ghana Card Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor1GhanaCard}
                    onChange={(e) => update('guarantor1GhanaCard', e.target.value.toUpperCase())}
                    placeholder="GHC-000000000-0"
                    className="field"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Residential / Work Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor1Address}
                    onChange={(e) => update('guarantor1Address', e.target.value)}
                    placeholder="e.g. H/No 14, East Legon, Accra"
                    className="field"
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: 16, background: '#f8fafc', borderRadius: 8, border: '1px solid var(--line)' }}>
              <strong style={{ fontSize: 13, color: 'var(--blue)', display: 'block', marginBottom: 12 }}>
                GUARANTOR 2 (Secondary)
              </strong>
              <div className="form-grid">
                <div>
                  <label style={labelStyle}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor2Name}
                    onChange={(e) => update('guarantor2Name', e.target.value)}
                    placeholder="e.g. Mary Adobea Darko"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.guarantor2Phone}
                    onChange={(e) => update('guarantor2Phone', e.target.value)}
                    placeholder="+233 50 123 4567"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Occupation / Employer *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor2Occupation}
                    onChange={(e) => update('guarantor2Occupation', e.target.value)}
                    placeholder="e.g. Business Owner / Merchant"
                    className="field"
                  />
                </div>
                <div>
                  <label style={labelStyle}>Ghana Card Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor2GhanaCard}
                    onChange={(e) => update('guarantor2GhanaCard', e.target.value.toUpperCase())}
                    placeholder="GHC-000000000-0"
                    className="field"
                    style={{ textTransform: 'uppercase' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={labelStyle}>Residential / Work Address *</label>
                  <input
                    type="text"
                    required
                    value={formData.guarantor2Address}
                    onChange={(e) => update('guarantor2Address', e.target.value)}
                    placeholder="e.g. Adenta SSNIT Flats, Block C"
                    className="field"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Document Uploads */}
        {step === 5 && (
          <div style={{ display: 'grid', gap: 16 }}>
            <p style={{ fontSize: 13, color: 'var(--muted)', margin: 0 }}>
              Provide document links or upload references. Clear photos taken on your mobile phone are accepted during the interview.
            </p>
            <div>
              <label style={labelStyle}>Driver License Front (URL or Document Reference)</label>
              <input
                type="text"
                value={formData.driverLicenseFrontUrl}
                onChange={(e) => update('driverLicenseFrontUrl', e.target.value)}
                placeholder="https://... or upload identifier"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Driver License Back (URL or Document Reference)</label>
              <input
                type="text"
                value={formData.driverLicenseBackUrl}
                onChange={(e) => update('driverLicenseBackUrl', e.target.value)}
                placeholder="https://... or upload identifier"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Ghana Card Front (URL or Document Reference)</label>
              <input
                type="text"
                value={formData.ghanaCardFrontUrl}
                onChange={(e) => update('ghanaCardFrontUrl', e.target.value)}
                placeholder="https://... or upload identifier"
                className="field"
              />
            </div>
            <div>
              <label style={labelStyle}>Proof of Residence / Utility Bill (Electricity / Water / GPS code)</label>
              <input
                type="text"
                value={formData.proofOfResidenceUrl}
                onChange={(e) => update('proofOfResidenceUrl', e.target.value)}
                placeholder="e.g. GhanaPost GPS: GA-183-9204 or document link"
                className="field"
              />
            </div>
            <div style={{ padding: 12, background: '#f8fafc', borderRadius: 8, fontSize: 12, color: 'var(--muted)' }}>
              ℹ️ Physical original copies of all uploaded documents must be presented at our vetting center during your interview.
            </div>
          </div>
        )}

        {/* STEP 6: Review & Sign */}
        {step === 6 && (
          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 10, border: '1px solid var(--line)', display: 'grid', gap: 14, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Applicant Name:</span>
                <strong>{formData.fullName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Ghana Card:</span>
                <strong>{formData.ghanaCardNumber}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Driver License:</span>
                <strong>{formData.driverLicenseNumber} ({formData.driverLicenseClass})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Vehicle Preference:</span>
                <strong>{formData.preferredVehicleType}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--line)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--muted)' }}>Operating Region:</span>
                <strong>{formData.operatingRegion}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>Guarantors:</span>
                <span>{formData.guarantor1Name} &amp; {formData.guarantor2Name}</span>
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', fontSize: 12.5, lineHeight: 1.5 }}>
              <input
                type="checkbox"
                required
                checked={formData.consent}
                onChange={(e) => update('consent', e.target.checked)}
                style={{ marginTop: 3, width: 18, height: 18, cursor: 'pointer' }}
              />
              <span>
                I hereby certify that all information submitted in this application is true, complete, and accurate. I authorize Mr Truth Agency to verify my license, background, and guarantor credentials in accordance with Ghanaian law.
              </span>
            </label>

            <div>
              <button
                type="submit"
                disabled={submitting || !formData.consent}
                className="btn btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', fontSize: 14 }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <FileCheck2 size={16} />}
                {submitting ? 'SUBMITTING APPLICATION...' : 'SUBMIT WORK & PAY APPLICATION'}
              </button>
            </div>
          </form>
        )}

        {/* Wizard Navigation Footer */}
        {step < 6 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="btn btn-ghost"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <ArrowLeft size={15} /> BACK
              </button>
            ) : <span />}

            <button
              type="button"
              onClick={nextStep}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              CONTINUE <ArrowRight size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
