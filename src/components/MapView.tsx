import type { RefObject } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type MapViewProps = {
  mapRef: RefObject<HTMLDivElement | null>;
  loading: boolean;
  error: string;
  onLocateUser: () => void;
};

const MapView = ({ mapRef, loading, error, onLocateUser }: MapViewProps) => {
  return (
    <div className="flex-1 relative min-h-0 w-full bg-muted/30">
      <div ref={mapRef} className="w-full h-full z-0" />

      {loading && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
          <Badge className="rounded-full px-4 py-2 text-sm backdrop-blur-sm shadow-lg">Определение местоположения...</Badge>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-20 animate-slideDown">
          <Badge variant="destructive" className="rounded-full px-4 py-2 text-sm shadow-lg">
            {error}
          </Badge>
        </div>
      )}

      <Button
        onClick={onLocateUser}
        size="icon"
        variant="secondary"
        className="absolute top-4 right-4 z-10 size-12 rounded-full text-2xl shadow-lg"
        title="Моё местоположение"
      >
        📍
      </Button>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -1rem);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default MapView;