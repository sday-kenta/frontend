import type { TouchEvent } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Coordinates = {
  lat: number;
  lng: number;
};

type PanelState = "collapsed" | "expanded" | "full";
type ActiveTab = "search" | "routes" | "favorites" | "profile";

type BottomSheetPanelProps = {
  panelHeight: number;
  isDragging: boolean;
  panelState: PanelState;
  coordinates: Coordinates;
  activeTab: ActiveTab;
  onTouchStart: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchMove: (event: TouchEvent<HTMLDivElement>) => void;
  onTouchEnd: () => void;
  onPanelClick: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onAddMarker: () => void;
  onShare: () => void;
  onSearch: () => void;
  onRoutes: () => void;
  onFavorites: () => void;
  onProfile: () => void;
  onOverlayClick: () => void;
};

const BottomSheetPanel = ({
  panelHeight,
  isDragging,
  panelState,
  coordinates,
  activeTab,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onPanelClick,
  onZoomIn,
  onZoomOut,
  onAddMarker,
  onShare,
  onSearch,
  onOverlayClick,
}: BottomSheetPanelProps) => {
  return (
    <>
      <div
        className="absolute bottom-0 left-0 right-0 bg-card text-card-foreground border-t shadow-[0_-4px_12px_rgba(0,0,0,0.15)] rounded-t-3xl z-30 transition-transform duration-200"
        style={{
          height: panelHeight,
          transition: isDragging ? "none" : "height 0.3s ease-out",
          touchAction: "none",
        }}
      >
        <div
          className="w-full flex justify-center pt-3 pb-2 cursor-pointer"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onClick={onPanelClick}
        >
          <div className="w-12 h-1.5 bg-border rounded-full hover:bg-muted-foreground/40 transition-colors" />
        </div>

        <Badge
          variant="outline"
          className="absolute top-2 right-4 text-xs text-muted-foreground font-normal"
        >
          {panelState === "collapsed" && "👆 Потяните вверх"}
          {panelState === "expanded" && "👆 Потяните для полного экрана"}
          {panelState === "full" && "👇 Потяните вниз"}
        </Badge>

        <div
          className="px-4 overflow-y-auto"
          style={{ height: panelHeight - 40 }}
        >
          <div className="py-3 flex items-center justify-between border-b border-border">
            <div className="bg-muted px-4 py-2 rounded-2xl font-mono text-sm text-muted-foreground flex-1 mr-3">
              <span className="text-xs block">Текущие координаты</span>
              <span>
                {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={onZoomIn}
                variant="secondary"
                size="icon"
                className="size-10 rounded-2xl text-xl font-bold"
              >
                +
              </Button>
              <Button
                onClick={onZoomOut}
                variant="secondary"
                size="icon"
                className="size-10 rounded-2xl text-xl font-bold"
              >
                −
              </Button>
            </div>
          </div>

          <div className="py-3 flex gap-2 border-b border-border">
            <Button onClick={onAddMarker} className="flex-1 h-11 rounded-xl">
              <span>📌</span>
              <span>Добавить метку</span>
            </Button>
            <Button
              onClick={onShare}
              variant="secondary"
              className="flex-1 h-11 rounded-xl"
            >
              <span>📋</span>
              <span>Поделиться</span>
            </Button>
          </div>

          <div className="flex items-center justify-around py-3">
            <Button
              onClick={onSearch}
              variant="ghost"
              className={cn(
                "h-auto flex flex-col items-center px-6 py-2 rounded-xl",
                activeTab === "search"
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              <span className="text-2xl mb-1">🔍</span>
              <span className="text-xs font-medium">Поиск</span>
            </Button>
          </div>

          {(panelState === "expanded" || panelState === "full") && (
            <div className="space-y-4 pb-6">
              <Card className="gap-0 py-0">
                <CardContent className="p-4">
                  <CardTitle className="text-base mb-3">
                    Быстрый поиск
                  </CardTitle>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Найти место..."
                      className="flex-1"
                      readOnly
                      onClick={() => alert("Поле поиска (тест)")}
                    />
                    <Button size="sm">Найти</Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="gap-0 py-0">
                <CardContent className="p-4">
                  <CardTitle className="text-base mb-3">
                   салам алейкум
                  </CardTitle>
                </CardContent>
              </Card>

              {panelState === "full" && (
                <Card className="gap-0 py-0">
                  <CardContent className="p-4">салам алейкум</CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {panelState === "full" && (
        <div
          className="absolute inset-0 bg-black/20 z-20 transition-opacity"
          onClick={onOverlayClick}
        />
      )}
    </>
  );
};

export default BottomSheetPanel;
