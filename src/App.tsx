import { useEffect, useRef, useState, type TouchEvent } from 'react';
import type { LeafletMouseEvent, Map as LeafletMap, Marker as LeafletMarker } from 'leaflet';

import MapView from './components/MapView';
import BottomSheetPanel from './components/BottomSheetPanel';

type Coordinates = {
  lat: number;
  lng: number;
};

type ActiveTab = 'search' | 'routes' | 'favorites' | 'profile';
type PanelState = 'collapsed' | 'expanded' | 'full';

const App = () => {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<LeafletMap | null>(null);
  const userMarkerRef = useRef<LeafletMarker | null>(null);
  const startYRef = useRef(0);
  const currentYRef = useRef(0);

  const [coordinates, setCoordinates] = useState<Coordinates>({ lat: 55.751244, lng: 37.618423 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mapZoom, setMapZoom] = useState(12);
  const [activeTab, setActiveTab] = useState<ActiveTab>('search');
  const [panelHeight, setPanelHeight] = useState(180);
  const [isDragging, setIsDragging] = useState(false);
  const [panelState, setPanelState] = useState<PanelState>('collapsed');

  const PANEL_COLLAPSED = 180;
  const PANEL_EXPANDED = 400;
  const PANEL_FULL = window.innerHeight - 100;

  useEffect(() => {
    import('leaflet').then((L) => {
      import('leaflet/dist/leaflet.css');

      if (mapRef.current && !mapInstanceRef.current) {
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: false,
        }).setView([coordinates.lat, coordinates.lng], mapZoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
          minZoom: 3,
        }).addTo(mapInstanceRef.current);

        mapInstanceRef.current.on('moveend', () => {
          const center = mapInstanceRef.current?.getCenter();
          const zoom = mapInstanceRef.current?.getZoom();
          if (!center || zoom === undefined) {
            return;
          }

          setCoordinates({ lat: center.lat, lng: center.lng });
          setMapZoom(zoom);
        });

        mapInstanceRef.current.on('click', (event: LeafletMouseEvent) => {
          setCoordinates({ lat: event.latlng.lat, lng: event.latlng.lng });
        });
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) {
      setError('Ваш браузер не поддерживает геолокацию');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setLoading(true);
    setError('');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        const mapInstance = mapInstanceRef.current;

        if (mapInstance) {
          mapInstance.setView([lat, lng], 16);

          import('leaflet').then((L) => {
            const customIcon = L.divIcon({
              className: 'custom-marker',
              html: '📍',
              iconSize: [30, 30],
              iconAnchor: [15, 30],
            });

            if (userMarkerRef.current) {
              userMarkerRef.current.setLatLng([lat, lng]);
            } else {
              userMarkerRef.current = L.marker([lat, lng], { icon: customIcon })
                .addTo(mapInstance)
                .bindPopup('Вы здесь');
            }

            userMarkerRef.current?.openPopup();
          });
        }

        setCoordinates({ lat, lng });
        setLoading(false);
      },
      (geoError) => {
        setLoading(false);

        let errorMessage = 'Ошибка определения местоположения';
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            errorMessage = 'Доступ к геолокации запрещен';
            break;
          case geoError.POSITION_UNAVAILABLE:
            errorMessage = 'Информация о местоположении недоступна';
            break;
          case geoError.TIMEOUT:
            errorMessage = 'Время ожидания истекло';
            break;
        }

        setError(errorMessage);
        setTimeout(() => setError(''), 3000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      },
    );
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (navigator.geolocation) {
        locateUser();
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() - 1);
    }
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    startYRef.current = event.touches[0].clientY;
    currentYRef.current = panelHeight;
    setIsDragging(true);
  };

  const handleTouchMove = (event: TouchEvent<HTMLDivElement>) => {
    if (!isDragging) {
      return;
    }

    const deltaY = startYRef.current - event.touches[0].clientY;
    const newHeight = currentYRef.current + deltaY;

    if (newHeight >= PANEL_COLLAPSED && newHeight <= PANEL_FULL) {
      setPanelHeight(newHeight);

      if (newHeight < PANEL_EXPANDED) {
        setPanelState('collapsed');
      } else if (newHeight < PANEL_FULL - 100) {
        setPanelState('expanded');
      } else {
        setPanelState('full');
      }
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);

    if (panelHeight < PANEL_COLLAPSED + (PANEL_EXPANDED - PANEL_COLLAPSED) / 2) {
      setPanelHeight(PANEL_COLLAPSED);
      setPanelState('collapsed');
    } else if (panelHeight < PANEL_EXPANDED + (PANEL_FULL - PANEL_EXPANDED) / 2) {
      setPanelHeight(PANEL_EXPANDED);
      setPanelState('expanded');
    } else {
      setPanelHeight(PANEL_FULL);
      setPanelState('full');
    }
  };

  const handlePanelClick = () => {
    if (panelState === 'collapsed') {
      setPanelHeight(PANEL_EXPANDED);
      setPanelState('expanded');
    } else if (panelState === 'expanded') {
      setPanelHeight(PANEL_FULL);
      setPanelState('full');
    } else {
      setPanelHeight(PANEL_COLLAPSED);
      setPanelState('collapsed');
    }
  };

  const handleSearch = () => {
    setActiveTab('search');
    alert('🔍 Поиск мест (тестовая функция)');
  };

  const handleRoutes = () => {
    setActiveTab('routes');
    alert('🚗 Построение маршрута (тестовая функция)');
  };

  const handleFavorites = () => {
    setActiveTab('favorites');
    alert('⭐ Избранные места (тестовая функция)');
  };

  const handleProfile = () => {
    setActiveTab('profile');
    alert('👤 Профиль пользователя (тестовая функция)');
  };

  const handleAddMarker = () => {
    const mapInstance = mapInstanceRef.current;
    if (!mapInstance) {
      return;
    }

    import('leaflet').then((L) => {
      const customIcon = L.divIcon({
        className: 'custom-marker',
        html: '📌',
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      L.marker([coordinates.lat, coordinates.lng], { icon: customIcon })
        .addTo(mapInstance)
        .bindPopup(`Тестовая метка<br>${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`)
        .openPopup();
    });
  };

  const handleShare = () => {
    navigator.clipboard
      ?.writeText(`https://maps.google.com/?q=${coordinates.lat},${coordinates.lng}`)
      .then(() => {
        alert('📍 Координаты скопированы в буфер обмена');
      })
      .catch(() => {
        alert(`📍 Координаты: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}`);
      });
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex flex-col bg-background text-foreground">
      <MapView mapRef={mapRef} loading={loading} error={error} onLocateUser={locateUser} />

      <BottomSheetPanel
        panelHeight={panelHeight}
        isDragging={isDragging}
        panelState={panelState}
        coordinates={coordinates}
        activeTab={activeTab}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onPanelClick={handlePanelClick}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onAddMarker={handleAddMarker}
        onShare={handleShare}
        onSearch={handleSearch}
        onRoutes={handleRoutes}
        onFavorites={handleFavorites}
        onProfile={handleProfile}
        onOverlayClick={() => {
          setPanelHeight(PANEL_EXPANDED);
          setPanelState('expanded');
        }}
      />
    </div>
  );
};

export default App;