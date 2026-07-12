import { useTranslation } from "react-i18next";
import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { QRCodeSVG } from 'qrcode.react';

export default function ReceiptPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');
  const isReprint = searchParams.get('reprint') === 'true';
  const [submission, setSubmission] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    window.print();
  };

  useEffect(() => {
    async function fetchSubmission() {
      if (!id) {
        setError('No Reference ID provided.');
        setLoading(false);
        return;
      }
      
      try {
        let docSnap: any = null;
        
        if (id.startsWith('JA-')) {
          const q = query(collection(db, "submissions"), where("formatted_tracking_id", "==", id));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            docSnap = querySnapshot.docs[0];
          }
        } else {
          const docRef = doc(db, "submissions", id);
          docSnap = await getDoc(docRef);
        }
        
        if (docSnap && docSnap.exists()) {
          setSubmission({ id: docSnap.id, ...docSnap.data() });
        } else {
          setError('Submission not found.');
        }
      } catch (err) {
        console.error("Error fetching submission:", err);
        setError('Error fetching submission details.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchSubmission();
  }, [id]);

  useEffect(() => {
    if (submission && !loading) {
      setTimeout(() => {
        window.print();
      }, 1000);
    }
  }, [submission, loading]);

  if (loading) {
    return <div className="p-10 text-center font-sans">Loading receipt details...</div>;
  }

  if (error || !submission) {
    return <div className="p-10 text-center font-sans text-red-600">{error}</div>;
  }

  const dateObj = new Date(submission.timestamp || Date.now());
  const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const generatedDateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-');
  const generatedTimeStr = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

  const refId = submission.formatted_tracking_id || submission.id;
  const trackingUrl = window.location.origin + "/?track=" + refId;
  const submissionType = submission.submission_type || 'DEVELOPMENT NEED';
  
  const evidenceType = submission.photo_url || (submission.photos && submission.photos.length > 0) ? 'With Photo' : 'Text Only';
  const submissionMethod = submission.photo_url || (submission.photos && submission.photos.length > 0) ? 'Text / Photo' : 'Text Only';

  return (
    <div ref={receiptRef} className="font-sans text-[11pt] text-black bg-white mx-auto min-h-[297mm] w-full max-w-[210mm] p-[20mm]" style={{ fontFamily: "Arial, 'Noto Sans', sans-serif" }}>
      <style>{`
        @media print {
          body { margin: 0; background: #fff; }
          .no-print { display: none !important; }
          @page { margin: 0; size: A4; }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
        }
      `}</style>

      {/* PRINT CONTROLS */}
      <div className="no-print mb-5 flex gap-4">
        <button 
          onClick={handleDownloadPDF}
          disabled={isGeneratingPdf}
          className={`${isGeneratingPdf ? 'bg-gray-400' : 'bg-[#1A237E]'} text-white px-6 py-3 rounded-lg font-bold cursor-pointer border-none shadow-sm flex-1 sm:flex-none flex justify-center items-center gap-2`}
        >
          {isGeneratingPdf ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Generating PDF...
            </span>
          ) : (
            <>🖨️ Save as PDF / Print</>
          )}
        </button>
        <button 
          onClick={() => {
            window.close();
            setTimeout(() => {
              window.location.href = '/';
            }, 300);
          }}
          className="bg-transparent border-2 border-gray-400 text-gray-700 px-6 py-3 rounded-lg font-bold cursor-pointer hover:bg-gray-50 flex-1 sm:flex-none"
        >
          ← Go Back
        </button>
      </div>

      {/* SECTION 1 — HEADER */}
      <div className="text-center mb-4">
        <div className="text-[28pt] leading-none mb-1">🇮🇳</div>
        <h1 className="font-bold text-[18pt] m-0 leading-tight">JAN AWAAZ PORTAL</h1>
        <p className="text-[12pt] m-0 mb-1 leading-tight">Multilingual Constituency Development Portal</p>
        <p className="text-[9pt] text-gray-500 m-0">A Google AI Studio Initiative | Powered by Gemini AI</p>
      </div>
      <hr className="border-t-2 border-black my-4" />

      {/* SECTION 2 — DOCUMENT TITLE */}
      <div className="text-center mb-4">
        <h2 className="font-bold underline text-[16pt] m-0">SUBMISSION ACKNOWLEDGEMENT</h2>
      </div>
      <hr className="border-t border-black mb-4" />

      {/* SECTION 3 — REFERENCE BOX */}
      <div className="border-[1.5px] border-black p-3 my-3 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <div className="font-bold text-[10pt]">{t("Reference No.")}:</div>
          <div className="font-bold text-[16pt] font-mono tracking-wider">{refId}</div>
        </div>
        <div className="mt-2 sm:mt-0 text-left sm:text-right">
          <div><span className="font-bold">{t("Date")}:</span> {dateStr}</div>
          <div><span className="font-bold">{t("Time")}:</span> {timeStr}</div>
          <div><span className="font-bold">{t("Status")}:</span> <span className="text-green-700 font-bold">✓ {t("RECEIVED")}</span></div>
        </div>
      </div>

      {/* SECTION 4 — SUBMISSION TYPE */}
      <div className="mb-4">
        <span className="font-bold">{t("Type of Submission")}:</span>{' '}
        {submissionType === 'EMERGENCY' ? 'URGENT' : submissionType === 'SERVICE FAILURE' ? 'SERVICE ISSUE' : 'DEVELOPMENT NEED'}
      </div>

      {/* SECTION 5 — LOCATION DETAILS */}
      <div className="mb-4">
        <div className="font-bold mb-1">{t("Location Details")}</div>
        <hr className="border-t border-gray-400 mb-2" />
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2 w-[40%]">Village/Ward:</td>
              <td className="py-1 px-2">{submission.village || submission.village_ward || 'Not Provided'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Gram Panchayat:</td>
              <td className="py-1 px-2">{submission.panchayat || submission.gram_panchayat_municipality || 'Not Provided'}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">Police Station:</td>
              <td className="py-1 px-2">{submission.police_station || 'Not Provided'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">District:</td>
              <td className="py-1 px-2">{submission.district_en || submission.district}, {submission.state_en || submission.state}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">Lok Sabha:</td>
              <td className="py-1 px-2">{submission.lok_sabha_en || submission.constituency || submission.loksabha_constituency}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Assembly:</td>
              <td className="py-1 px-2">{submission.assembly_en || submission.assembly_constituency || 'Not Provided'}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">Pincode:</td>
              <td className="py-1 px-2">{submission.pincode || 'Not Provided'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Submitted from:</td>
              <td className="py-1 px-2">{submission.latitude && submission.longitude ? 'On-site' : 'Remote'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 6 — CITIZEN DETAILS */}
      <div className="mb-4">
        <div className="font-bold mb-1">{t("Citizen Details")}</div>
        <hr className="border-t border-gray-400 mb-2" />
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2 w-[40%]">Name:</td>
              <td className="py-1 px-2">{submission.anonymous ? 'Anonymous' : (submission.name || 'Not Provided')}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Phone:</td>
              <td className="py-1 px-2">{submission.phone || submission.phone_number || 'Not Provided'}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">WhatsApp:</td>
              <td className="py-1 px-2">{submission.is_whatsapp ? 'Yes' : 'No'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Language Used:</td>
              <td className="py-1 px-2">{submission.language_detected || 'English'}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">Submission Method:</td>
              <td className="py-1 px-2">{submissionMethod}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 7 — YOUR SUBMISSION */}
      <div className="mb-4">
        <div className="font-bold mb-1">{t("Your Submission")}</div>
        <hr className="border-t border-gray-400 mb-1" />
        <div className="text-[9pt] italic text-gray-500 mb-2">Shown in your original language exactly as submitted.</div>
        <div className="border border-black p-3 bg-[#F9F9F9] whitespace-pre-wrap">
          {submission.text_original}
        </div>
      </div>

      {/* SECTION 8 — AI UNDERSTANDING */}
      <div className="mb-4">
        <div className="font-bold mb-1">{t("What We Understood")}</div>
        <hr className="border-t border-gray-400 mb-2" />
        <table className="w-full text-left border-collapse">
          <tbody>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2 w-[40%]">Development Sector:</td>
              <td className="py-1 px-2">{submission.development_sector || submission.category || 'Not Provided'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Need Identified:</td>
              <td className="py-1 px-2">{submission.what_is_needed || submission.normalised_text || submission.issue_summary || 'Not Provided'}</td>
            </tr>
            <tr className="bg-[#F9F9F9]">
              <td className="font-bold py-1 px-2">Tags:</td>
              <td className="py-1 px-2">{submission.tags && submission.tags.length > 0 ? submission.tags.join(', ') : 'None'}</td>
            </tr>
            <tr>
              <td className="font-bold py-1 px-2">Evidence Type:</td>
              <td className="py-1 px-2">{evidenceType}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* SECTION 9 — ACKNOWLEDGEMENT */}
      <div className="mb-6 leading-relaxed text-[11pt]">
        <p className="mb-2">Dear Citizen,</p>
        <p className="mb-2">
          Your development suggestion regarding {submission.development_sector || submission.category || 'your constituency'} has been successfully received on {dateStr} at {timeStr}. Your Reference Number is <strong>{refId}</strong>.
        </p>
        <p className="mb-2">
          This submission has been shared with the office of your Member of Parliament for {submission.lok_sabha_en || submission.loksabha_constituency} and will contribute to constituency development planning.
        </p>
        <p>
          Please retain this receipt for your records. Quote your Reference Number for any future communication.
        </p>
      </div>

      {/* SECTION 10 — FOOTER */}
      <hr className="border-t-[1.5px] border-black mb-4" />
      <div className="flex justify-between items-center mb-4 text-[9pt]">
        <div className="flex-1">
          <div className="font-bold">Jan Awaaz Portal</div>
          <div>janawaaz.in</div>
        </div>
        
        
        <div className="flex-1 flex justify-center">
          <div className="border border-black p-2 text-center w-[120px] flex flex-col items-center">
            <div className="text-[7pt] font-bold mb-1">SCAN TO TRACK</div>
            <QRCodeSVG value={trackingUrl} size={70} level="M" />
            <div className="text-[6pt] mt-1 font-bold">{refId}</div>
          </div>
        </div>
        
        <div className="flex-1 text-right">
          <div className="font-bold">Powered by Gemini AI</div>
          <div>Google Cloud Platform</div>
        </div>
      </div>

      <div className="text-center text-gray-500 text-[8pt]">
        This is a computer-generated acknowledgement and does not require a physical signature.<br/>
        {isReprint ? 'Reprinted on: ' : 'Generated on: '} {generatedDateStr} {generatedTimeStr}
      </div>

    </div>
  );
}
