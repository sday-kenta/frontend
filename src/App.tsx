import { lazy, Suspense, useEffect, useState } from 'react';
import './index.css';
import PwaOnlyGate from './pwa/PwaOnlyGate';
import { AppLaunchSplash } from './components/AppLaunchSplash';

const MapScreen = lazy(() => import('./pages/Map/MapScreen'));

function App() {
  const [showLaunchSplash, setShowLaunchSplash] = useState(true);
  const [isLaunchSplashVisible, setIsLaunchSplashVisible] = useState(true);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsLaunchSplashVisible(false);
    }, 850);

    const removeTimer = window.setTimeout(() => {
      setShowLaunchSplash(false);
    }, 1400);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  return (
    <PwaOnlyGate>
      <Suspense fallback={<AppLaunchSplash fullscreen={false} />}>
        <MapScreen />
      </Suspense>
      {showLaunchSplash && <AppLaunchSplash isVisible={isLaunchSplashVisible} />}
    </PwaOnlyGate>
  );
}

export default App;
