import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MapScreen from './pages/Map/MapScreen';
import RubricsScreen from './pages/Rubrics/RubricsScreen';
import './index.css';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[#f3f4f6] dark:bg-[#0d0d0d] text-slate-900 dark:text-[#fafafa]">
        <Routes>
          <Route path="/" element={<MapScreen />} />
          <Route path="/rubrics" element={<RubricsScreen />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
