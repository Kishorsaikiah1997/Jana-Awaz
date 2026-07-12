import { useTranslation } from "react-i18next";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function Receipt({ data }: { data: any }) {
  const { t } = useTranslation();
  if (!data) return null;

  const dateObj = data.timestamp ? new Date(data.timestamp) : new Date();
  const dateStr = dateObj.toLocaleDateString('en-GB').replace(/\//g, '-');
  const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  
  const id = data.formatted_tracking_id || data.id;
  const year = dateObj.getFullYear();
  const rawId = data.id || '';
  const first8 = rawId.substring(0, 8).toUpperCase();
  const generatedId = id || `JA-${year}-${first8}`;

  const trackingUrl = window.location.origin + "/?track=" + generatedId;
  const currentDateTime = new Date().toLocaleString('en-GB').replace(/\//g, '-');

  return (
    <div id="receipt" className="hidden print:block absolute top-0 left-0 w-full bg-white z-50 text-black min-h-screen">
      {/* SECTION 1 - HEADER */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '24pt', marginBottom: '8px' }}>🇮🇳</div>
        <div style={{ fontSize: '18pt', fontWeight: 'bold' }}>JAN AWAAZ PORTAL</div>
        <div style={{ fontSize: '12pt' }}>Multilingual Citizen Request & Work Portal</div>
        <div style={{ fontSize: '9pt', color: '#666' }}>A Government of India Initiative</div>
      </div>
      <hr style={{ border: 'none', borderTop: '1.5px solid black', margin: '8px 0' }} />

      {/* SECTION 2 - DOCUMENT TITLE */}
      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <div style={{ fontSize: '16pt', fontWeight: 'bold', textDecoration: 'underline' }}>Work Request Acknowledgement</div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '16px' }} />

      {/* SECTION 3 - REFERENCE LINE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11pt' }}>
        <div style={{ fontWeight: 'bold' }}>Request No: {generatedId}</div>
        <div>{t("Date")}: {dateStr} &nbsp;&nbsp;&nbsp; {t("Time")}: {timeStr}</div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '16px' }} />

      {/* SECTION 4 - BODY PARAGRAPH */}
      <p style={{ fontSize: '11pt', lineHeight: 1.6, marginBottom: '24px' }}>
        Dear Citizen,
        <br /><br />
        Your work request regarding <strong>{data.category || 'General'}</strong> has been successfully submitted on {dateStr} at {timeStr} and your Request Number is {generatedId}. Please use this Request Number for all future communication and tracking related to this submission.
        <br /><br />
        Your work request has been registered and forwarded to the office of your Member of Parliament for <strong>{data.constituency || data.loksabha_constituency || 'your'}</strong> constituency for review and necessary action. You may expect acknowledgement from the MP office within 30 working days.
      </p>

      {/* SECTION 5 - COMPLAINT DETAILS */}
      <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>Request Details</div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '8px' }} />
      <div style={{ marginBottom: '24px', width: '100%' }}>
        {[
          ['Request No:', generatedId],
          [`Submission ${t('Date')}:`, dateStr],
          [`Submission ${t('Time')}:`, timeStr],
          ['Category:', data.category || 'General'],
          ['Urgency Level:', data.urgency || 'Medium'],
          [`${t('Status')}:`, 'REGISTERED']
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 4px', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9f9f9', fontSize: '11pt' }}>
            <div style={{ width: '40%', fontWeight: 'bold' }}>{row[0]}</div>
            <div style={{ width: '60%' }}>{row[1]}</div>
          </div>
        ))}
      </div>

      {/* SECTION 6 - LOCATION DETAILS */}
      <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>{t("Location Details")}</div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '8px' }} />
      <div style={{ marginBottom: '24px', width: '100%' }}>
        {[
          ['Village / Ward:', data.village || data.village_ward || 'Not Provided'],
          ['Gram Panchayat:', data.panchayat || data.gram_panchayat_municipality || 'Not Provided'],
          ['Police Station:', data.police_station || 'Not Provided'],
          ['District:', data.district || 'Not Provided'],
          ['State:', data.state || 'Not Provided'],
          ['Lok Sabha Constituency:', data.constituency || data.loksabha_constituency || 'Not Provided'],
          ['Assembly Constituency:', data.assembly_constituency || 'Not Provided'],
          ['Pincode:', data.pincode || 'Not Provided']
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 4px', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9f9f9', fontSize: '11pt' }}>
            <div style={{ width: '40%', fontWeight: 'bold' }}>{row[0]}</div>
            <div style={{ width: '60%' }}>{row[1]}</div>
          </div>
        ))}
      </div>

      {/* SECTION 7 - COMPLAINANT DETAILS */}
      <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>Requester Details</div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '8px' }} />
      <div style={{ marginBottom: '24px', width: '100%' }}>
        {[
          ['Name:', data.anonymous ? 'Anonymous' : (data.name || 'Anonymous')],
          ['Mobile:', data.phone || data.phone_number || 'Not Provided'],
          ['Photo Attached:', data.photo_url || (data.photos && data.photos.length > 0) ? 'Yes' : 'No'],
          ['GPS Tagged:', data.latitude || (data.photos && data.photos.length > 0 && data.photos[0].location) ? 'Yes' : 'No'],
          ['Language Used:', data.language_detected || 'Unknown']
        ].map((row, i) => (
          <div key={i} style={{ display: 'flex', padding: '6px 4px', backgroundColor: i % 2 === 0 ? '#ffffff' : '#f9f9f9', fontSize: '11pt' }}>
            <div style={{ width: '40%', fontWeight: 'bold' }}>{row[0]}</div>
            <div style={{ width: '60%' }}>{row[1]}</div>
          </div>
        ))}
      </div>

      {/* SECTION 8 - ORIGINAL COMPLAINT TEXT */}
      <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>Your Work Request</div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '4px' }} />
      <div style={{ fontSize: '9pt', color: '#666', fontStyle: 'italic', marginBottom: '8px' }}>
        Shown below in your original language exactly as submitted. No modifications made.
      </div>
      <div style={{ border: '1px solid black', padding: '12px', minHeight: '60px', marginBottom: '24px', fontSize: '11pt', whiteSpace: 'pre-wrap' }}>
        {data.text_original}
      </div>

      {/* SECTION 8.5 - AI PHOTO ANALYSIS SUMMARY */}
      {data.photo_url && data.photo_analysis && !data.photo_analysis.analysis_failed && (
        <>
          <div style={{ fontSize: '12pt', fontWeight: 'bold', marginBottom: '4px' }}>AI Photo Analysis Summary</div>
          <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '8px' }} />
          <div style={{ marginBottom: '8px', width: '100%', fontSize: '11pt' }}>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Photo submitted:</div>
              <div style={{ width: '60%' }}>Yes</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#f9f9f9' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>AI detected:</div>
              <div style={{ width: '60%' }}>{data.photo_analysis.what_is_shown}</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Severity assessed:</div>
              <div style={{ width: '60%' }}>{data.photo_analysis.severity_from_photo}</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#f9f9f9' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Safety concern:</div>
              <div style={{ width: '60%' }}>{data.photo_analysis.safety_concern ? 'Yes' : 'No'}</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Recommended action:</div>
              <div style={{ width: '60%' }}>{data.photo_analysis.actionable_insight}</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#f9f9f9' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Analysis confidence:</div>
              <div style={{ width: '60%' }}>{Math.round(data.photo_analysis.confidence * 100)}%</div>
            </div>
            <div style={{ display: 'flex', padding: '6px 4px', backgroundColor: '#ffffff' }}>
              <div style={{ width: '40%', fontWeight: 'bold' }}>Analyzed by:</div>
              <div style={{ width: '60%' }}>Gemini Vision AI</div>
            </div>
          </div>
          <div style={{ fontSize: '9pt', fontStyle: 'italic', color: '#666', marginBottom: '24px' }}>
            This analysis is AI-generated and subject to human verification.
          </div>
        </>
      )}

      {/* SECTION 9 - IMPORTANT NOTICE */}
      <div style={{ border: '1px solid black', padding: '12px', marginTop: '16px', marginBottom: '40px' }}>
        <div style={{ fontSize: '11pt', fontWeight: 'bold', marginBottom: '8px', fontVariant: 'small-caps' }}>IMPORTANT NOTICE</div>
        <div style={{ fontSize: '10pt', lineHeight: 1.5 }}>
          Please retain this receipt for your records. The Request Number {generatedId} is your official reference for all future communications regarding this work request.
          <br /><br />
          To track the status of your request online, visit the Jan Awaaz portal and enter your Request Number in the Track section.
          <br /><br />
          If you do not receive any response within 30 working days, you may escalate the matter to the MP office directly by presenting this receipt.
        </div>
      </div>

      {/* SECTION 10 - FOOTER */}
      <hr style={{ border: 'none', borderTop: '1.5px solid black', marginBottom: '8px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>Jan Awaaz Portal</div>
          <div style={{ fontSize: '9pt' }}>Multilingual Citizen Request & Work Portal</div>
        </div>
        
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '1px solid black', width: '100px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', padding: '4px' }}>
            <div style={{ fontSize: '7pt', fontWeight: 'bold', marginBottom: '4px' }}>SCAN TO TRACK</div>
            <QRCodeSVG value={trackingUrl} size={70} level="M" />
            <div style={{ fontSize: '7pt', fontWeight: 'bold', marginTop: '4px' }}>{generatedId}</div>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 'bold', fontSize: '11pt' }}>Powered by Gemini AI</div>
          <div style={{ fontSize: '9pt' }}>Google Cloud Platform</div>
        </div>
      </div>
      <hr style={{ border: 'none', borderTop: '1px solid black', marginBottom: '8px' }} />
      
      <div style={{ textAlign: 'center', fontSize: '8pt', color: '#666', marginTop: '16px' }}>
        This is a computer-generated acknowledgement and does not require a signature.
        <br />
        Generated on: {currentDateTime}
      </div>
    </div>
  );
}
