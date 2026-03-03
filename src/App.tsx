import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

const MapScreen = lazy(() => import('./pages/Map/MapScreen'));
const RubricsScreen = lazy(() => import('./pages/Rubrics/RubricsScreen'));

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0d0d0d] text-slate-900 dark:text-[#fafafa]">
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<MapScreen />} />
            <Route path="/rubrics" element={<RubricsScreen />} />
          </Routes>
        </Suspense>
      </div>
    </BrowserRouter>
  );
}

export default App;
