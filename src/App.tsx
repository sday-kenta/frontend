import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Layout/Navbar';

// Создай простую главную страницу прямо здесь для проверки
function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Главная страница</h1>
      <p className="text-gray-600 mt-2">Добро пожаловать в "Сознательный гражданин"!</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          {/* Главная страница по пути / */}
          <Route path="/" element={<HomePage />} />
          
          {/* Заглушки для других страниц */}
          <Route path="/map" element={<div className="p-8">Карта</div>} />
          <Route path="/about" element={<div className="p-8">О проекте</div>} />
          <Route path="/incidents" element={<div className="p-8">Все обращения</div>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;