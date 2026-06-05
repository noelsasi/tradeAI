import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { TopBar } from '@/common/components/layout/top-bar'
import { DetailDrawer } from '@/common/components/organisms/detail-drawer'
import { ToastRegion } from '@/common/components/organisms/toast-region'
import { HistoryScreen } from '@/screens/history/history-screen'
import { IntegrationScreen } from '@/screens/integration/integration-screen'
import { LandingScreen } from '@/screens/landing/landing-screen'
import { ProcessingScreen } from '@/screens/processing/processing-screen'
import { ResultsScreen } from '@/screens/results/results-screen'

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: '#F4F7FB' }}>
      <TopBar />
      <main>{children}</main>
      <DetailDrawer />
      <ToastRegion />
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingScreen />} />
          <Route path="/processing/:jobId" element={<ProcessingScreen />} />
          <Route path="/results/:jobId" element={<ResultsScreen />} />
          <Route path="/history" element={<HistoryScreen />} />
          <Route path="/integrations" element={<IntegrationScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
