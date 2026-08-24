import React, { useState, useEffect } from 'react';
import { Header } from './components/shell/Header';
import { Footer } from './components/shell/Footer';
import { ParticleCanvas } from './components/shell/ParticleCanvas';
import { EncryptionStudio } from './components/views/EncryptionStudio';
import { PipelineVisualizer } from './components/views/PipelineVisualizer';
import { DecryptionInspector } from './components/views/DecryptionInspector';
import { AttackSandbox } from './components/views/AttackSandbox';
import { MetricsDashboard } from './components/views/MetricsDashboard';
import type { EncryptResult, ViewType } from './types';
import { fetchHealth } from './services/api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('encrypt');
  const [systemStatus, setSystemStatus] = useState<'secure' | 'tamper_detected' | 'processing'>('secure');
  const [encryptResult, setEncryptResult] = useState<EncryptResult | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    fetchHealth()
      .then(() => setWsConnected(true))
      .catch(() => setWsConnected(false));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#FAF9F6] text-[#1C1917] font-serif selection:bg-amber-100 selection:text-amber-950 pb-16">
      {/* Background Paper Texture & Ambient Lighting */}
      <ParticleCanvas />

      {/* Global Masthead Navbar */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        systemStatus={systemStatus}
        wsConnected={wsConnected}
      />

      {/* Main View Port */}
      <main className="relative z-10 pt-16 px-4 md:px-8">
        {currentView === 'encrypt' && (
          <EncryptionStudio
            onEncryptComplete={(res) => {
              setEncryptResult(res);
              setSystemStatus('secure');
            }}
            onNavigateToPipeline={() => setCurrentView('pipeline')}
          />
        )}

        {currentView === 'pipeline' && (
          <PipelineVisualizer
            encryptResult={encryptResult}
            onNavigateToDecrypt={() => setCurrentView('decrypt')}
          />
        )}

        {currentView === 'decrypt' && <DecryptionInspector />}

        {currentView === 'sandbox' && <AttackSandbox />}

        {currentView === 'metrics' && <MetricsDashboard />}
      </main>

      {/* Editorial Footer */}
      <Footer />
    </div>
  );
};

export default App;
