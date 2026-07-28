import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import Sidebar from './components/Sidebar';
import DebugPanel from './components/DebugPanel';
import ChatPage from './pages/ChatPage';
import MetricsPage from './pages/MetricsPage';

function AppContent() {
  const {
    activePage,
    settings,
    activeRetrieval,
    activePrompt,
    activeMetrics,
  } = useApp();

  const renderPage = () => {
    if (activePage === 'metrics') return <MetricsPage />;
    return <ChatPage />;
  };

  return (
    <div className={`flex h-screen bg-canvas text-ink font-sans overflow-hidden ${settings.theme === 'dark' ? 'dark' : ''}`}>
      <Sidebar />
      <main className="flex-1 flex overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </div>
        {settings.showDebugPanel && activePage === 'chat' && (
          <DebugPanel
            retrievalResults={activeRetrieval}
            prompt={activePrompt}
            metrics={activeMetrics}
          />
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
