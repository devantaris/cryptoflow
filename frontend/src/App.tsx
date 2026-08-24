import React, { useState, useEffect } from 'react';
import { Header } from './components/shell/Header';
import { Footer } from './components/shell/Footer';
import { ParticleCanvas } from './components/shell/ParticleCanvas';
import { LandingPage } from './components/views/LandingPage';
import { EncryptionStudio } from './components/views/EncryptionStudio';
import { PipelineVisualizer } from './components/views/PipelineVisualizer';
import { DecryptionInspector } from './components/views/DecryptionInspector';
import { AttackSandbox } from './components/views/AttackSandbox';
import { MetricsDashboard } from './components/views/MetricsDashboard';
import type { EncryptResult, ViewType } from './types';
import { fetchHealth } from './services/api';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewType>('landing');
  const [systemStatus, setSystemStatus] = useState<'secure' | 'tamper_detected' | 'processing'>('secure');
  const [encryptResult, setEncryptResult] = useState<EncryptResult | null>(null);
  const [wsConnected, setWsConnected] = useState<boolean>(false);

  useEffect(() => {
    fetchHealth()
      .then(() => setWsConnected(true))
      .catch(() => setWsConnected(false));
  }, []);

  return (
    <div className="relative min-h-screen bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-cyan-500/20 selection:text-cyan-300 pb-16">
      {/* Background Particle Mesh & Ambient Lighting */}
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
        {currentView === 'landing' && (
          <LandingPage onNavigate={(view) => setCurrentView(view)} />
        )}

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
