import React, { useState } from 'react';
import MapTab from './MapTab';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('map');
  const [submissions, setSubmissions] = useState([]);
  const [themesData, setThemesData] = useState(null);

  return (
    <div className="min-h-screen bg-[#FDF6E3] font-sans text-[#3E2723]">
      <header>Header</header>
      <main className="max-w-7xl mx-auto p-4 sm:p-8">
        {/* TAB CONTENTS */}
        {activeTab === 'map' && (
          <MapTab submissions={submissions} themesData={themesData} />
        )}
      </main>
    </div>
  );
}
