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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100 font-sans selection:bg-zinc-800 selection:text-zinc-100 pb-12">
      {/* Background Interactive Starfield / Ambient Mesh */}
      <ParticleCanvas />

      {/* Global Navbar */}
      <Header
        currentView={currentView}
        onSelectView={setCurrentView}
        systemStatus={systemStatus}
        wsConnected={wsConnected}
      />

      {/* Main View Port */}
      <main className="relative z-10 pt-16 px-4 md:px-6">
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default App;
