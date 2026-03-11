import { lazy } from 'react';
import './index.css';

const MapScreen = lazy(() => import('./pages/Map/MapScreen'));

function App() {
  return (
    <MapScreen />
  );
}

export default App;
