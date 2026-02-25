import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Layout/Navbar';
import RubricsScreen from './pages/Rubrics/RubricsScreen';
import './index.css';

// Если хочешь свой фон — укажи путь к картинке здесь.
// Например: const customBackgroundUrl = "/images/backgrounds/photo1.jpg";
const customBackgroundUrl: string | null = null;

function App() {
  const handleRubricSelect = (rubric: any) => {
    console.log('Выбрана рубрика:', rubric);
  };

  return (
    <BrowserRouter>
      <div className="min-h-screen relative overflow-hidden bg-gray-50 dark:bg-slate-950">
        {/* Упрощенный фон — один градиентный слой */}
        <div
          className="animated-bg"
          style={customBackgroundUrl ? { backgroundImage: `url(${customBackgroundUrl})` } : undefined}
        />
        
        {/* Контент поверх фона */}
        <div className="relative z-10 min-h-screen bg-white/50 dark:bg-slate-900/70">
          <Navbar />
          <main className="pt-16 pb-24">
            <Routes>
              <Route 
                path="/" 
                element={<RubricsScreen onRubricSelect={handleRubricSelect} />} 
              />
              <Route path="/map" element={<div className="p-8">Карта</div>} />
              <Route path="/about" element={<div className="p-8">О проекте</div>} />
              <Route path="/incidents" element={<div className="p-8">Все обращения</div>} />
              <Route path="/create" element={<div className="p-8">Создать обращение</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;