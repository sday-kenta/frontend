import { lazy } from 'react';
import './index.css';
import PwaOnlyGate from './pwa/PwaOnlyGate';

const MapScreen = lazy(() => import('./pages/Map/MapScreen'));

function App() {
  return (
    <PwaOnlyGate>
      <MapScreen />
    </PwaOnlyGate>
  );
}

export default App;
