import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './index.css';

const MapScreen = lazy(() => import('./pages/Map/MapScreen'));
const RubricsScreen = lazy(() => import('./pages/Rubrics/RubricsScreen'));

function App() {
  return (
    <MapScreen />
  );
}

export default App;
