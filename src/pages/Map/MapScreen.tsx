import { useCallback, useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import maplibregl, { type MapMouseEvent } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Loader2,
  Plus,
  Minus,
  MapPin,
  ChevronRight,
  Copy,
  Navigation,
  X,
  Home,
  FolderOpen,
  Filter,
  User,
  MessageCircle,
  Settings,
  Car,
  ShoppingBag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn, resolveAvatarUrl } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import ProfileTabComponent from '@/components/ProfileTab';

const ProfileTab = ProfileTabComponent as ComponentType<{
  userId: number;
  onAvatarChange?: (url: string | null) => void;
}>;

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  place_id?: number;
}

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const DEBOUNCE_MS = 400;

const OSM_STYLE_LIGHT: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap',
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

async function searchAddress(q: string): Promise<GeocodingResult[]> {
  if (!q.trim() || q.length < 3) return [];
  const params = new URLSearchParams({ q, format: 'json', limit: '8' });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map((i: { lat: string; lon: string; display_name: string; place_id: number }) => ({
    lat: parseFloat(i.lat),
    lng: parseFloat(i.lon),
    display_name: i.display_name,
    place_id: i.place_id,
  }));
}

type Tab = 'home' | 'my' | 'all' | 'profile' | 'settings' | 'auth';
type SheetMode = 'tabs' | 'marker' | 'rubric' | null;

export default function MapScreen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);

  const [center, setCenter] = useState({ lat: 53.2, lng: 50.15 });
  const [zoom] = useState(13);
  const [marker, setMarker] = useState<{
    lat: number;
    lng: number;
    address?: string;
    district?: string;
  } | null>(null);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [settingsView, setSettingsView] = useState<'main' | 'about' | 'feedback'>('main');
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('dark');
  const [selectedRubric, setSelectedRubric] = useState<Rubric | null>(null);
  const [rubricStep, setRubricStep] = useState<'select' | 'create' | 'preview'>('select');
  const [reportTitle, setReportTitle] = useState('');
  const [reportText, setReportText] = useState('');
  const [reportPhotos, setReportPhotos] = useState<File[]>([]);
  const [reportPhotoPreviews, setReportPhotoPreviews] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<{
    id?: number;
    first_name?: string;
    last_name?: string;
    avatar_url?: string | null;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.localStorage.getItem('userId');
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const longPressRef = useRef<{
    timer: ReturnType<typeof setTimeout> | null;
    coords: { lat: number; lng: number } | null;
  }>({ timer: null, coords: null });
  const closeSheetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const profileScrollRef = useRef<HTMLDivElement | null>(null);
  const profileTouchStartYRef = useRef<number | null>(null);

  type Rubric = {
    id: number;
    title: string;
    icon: React.ReactNode;
    color: string;
    description: string;
    path: string;
  };

  const rubrics: Rubric[] = [
    {
      id: 1,
      title: 'Нарушение правил парковки',
      icon: <Car className="h-8 w-8" />,
      color: 'from-blue-500 to-blue-600',
      description:
        'Неправильная парковка, место для инвалидов и другие нарушения',
      path: '/create/parking',
    },
    {
      id: 2,
      title: 'Просроченные товары',
      icon: <ShoppingBag className="h-8 w-8" />,
      color: 'from-purple-500 to-pink-500',
      description: 'Продажа просроченных продуктов в магазинах',
      path: '/create/products',
    },
  ];

  const fetchSuggestions = useCallback(
    (q: string) => {
      if (!q.trim() || q.length < 3) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      searchAddress(q)
        .then((data) => {
          // сортируем варианты по близости к текущему центру, но показываем все
          type WithDist = GeocodingResult & { _dist: number };
          const withDistance: WithDist[] = data.map((s) => ({
            ...s,
            _dist:
              Math.pow(s.lat - center.lat, 2) +
              Math.pow(s.lng - center.lng, 2),
          }));
          withDistance.sort((a, b) => a._dist - b._dist);
          const sorted: GeocodingResult[] = withDistance.map(
            ({ _dist, ...rest }) => rest
          );
          setSuggestions(sorted);
          setShowSuggestions(sorted.length > 0);
        })
        .finally(() => setLoading(false));
    },
    [center]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(query), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, fetchSuggestions]);

  // Подтягиваем профиль текущего пользователя по сохранённому userId.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userId = window.localStorage.getItem('userId');
    if (!userId) return;

    fetch(`/v1/users/${userId}`)
      .then(async (res) => (res.ok ? res.json() : null))
      .then((json: unknown) => {
        if (!json) return;
        const raw =
          Array.isArray(json) ? json[0] : (json as { data?: unknown }).data ?? json;
        if (raw && typeof raw === 'object')
          setUserProfile(
            raw as { id?: number; first_name?: string; last_name?: string; avatar_url?: string | null },
          );
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    // Используем click вместо mousedown, чтобы не прятать список при
    // перемещении курсора от инпута к выпадающему списку
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSelectSuggestion = (s: GeocodingResult) => {
    setCenter({ lat: s.lat, lng: s.lng });
    setMarker({ lat: s.lat, lng: s.lng, address: s.display_name });
    setQuery(s.display_name);
    setShowSuggestions(false);
  };

  const handlePlaceMarker = useCallback((lat: number, lng: number) => {
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    setSheetMode('marker');
    const params = new URLSearchParams({
      lat: String(lat),
      lon: String(lng),
      format: 'json',
    });
    fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, {
      headers: { Accept: 'application/json' },
    })
      .then((r) => r.json())
      .then((data) => {
        const addr = data.address;
        const district =
          addr?.suburb || addr?.district || addr?.municipality || addr?.city;
        setMarker((prev) =>
          prev
            ? {
                ...prev,
                address: data.display_name ?? 'Выбранная точка',
                district: district || undefined,
              }
            : prev
        );
      })
      .catch(() => {});
  }, []);

  const clearMarker = () => {
    setMarker(null);
    if (sheetMode === 'marker') {
      setSheetMode(null);
    }
  };

  const handleSheetTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSheetOpen) return;

    // Drag должен начинаться только за ручку (handle), иначе при обычном скролле
    // пользователи случайно "закрывают" простыню.
    const target = e.target as HTMLElement | null;
    if (!target || !target.closest('[data-sheet-drag-handle="true"]')) {
      return;
    }

    // Если пользователь начинает жест внутри прокручиваемой области,
    // даём ему скроллить контент и не запускаем drag для закрытия слайда
    if (target && target.closest('[data-sheet-scrollable="true"]')) {
      return;
    }
    const touch = e.touches[0];
    sheetDragStartYRef.current = touch.clientY;
    setIsSheetDragging(true);
  };

  const handleSheetTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isSheetOpen || sheetDragStartYRef.current === null) return;
    const touch = e.touches[0];
    const delta = touch.clientY - sheetDragStartYRef.current;
    setSheetDragY(delta > 0 ? delta : 0);
  };

  const handleSheetTouchEnd = () => {
    if (!isSheetOpen) {
      setSheetDragY(0);
      setIsSheetDragging(false);
      sheetDragStartYRef.current = null;
      return;
    }

    const threshold = 80;
    if (sheetDragY > threshold) {
      softCloseSheet();
      setIsSheetDragging(false);
      sheetDragStartYRef.current = null;
      return;
    }

    setSheetDragY(0);
    setIsSheetDragging(false);
    sheetDragStartYRef.current = null;
  };

  const handleLocateMe = () => {
    if (!navigator.geolocation || !mapInstanceRef.current) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCenter({ lat: latitude, lng: longitude });
        const map = mapInstanceRef.current;
        map?.flyTo({
          center: [longitude, latitude],
          zoom: 16,
        });

        // Обновляем постоянный маркер текущего местоположения
        if (map) {
          if (userLocationMarkerRef.current) {
            userLocationMarkerRef.current.remove();
            userLocationMarkerRef.current = null;
          }
          const el = document.createElement('div');
          el.innerHTML = `
            <div style="
              width: 18px; height: 18px;
              border-radius: 9999px;
              border: 2px solid white;
              background: radial-gradient(circle at center, #38bdf8 0%, #0ea5e9 40%, rgba(56,189,248,0) 70%);
              box-shadow: 0 0 0 4px rgba(56,189,248,0.35);
            "></div>
          `;
          const userMarker = new maplibregl.Marker({ element: el })
            .setLngLat([longitude, latitude])
            .addTo(map);
          userLocationMarkerRef.current = userMarker;
        }
        setLocating(false);
      },
      () => setLocating(false),
      {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000,
      }
    );
  };

  const handleCreateReport = () => {
    if (!marker) return;
    setSelectedRubric(null);
    setRubricStep('select');
    setSheetMode('rubric');
  };

  const copyCoords = () => {
    if (!marker) return;
    navigator.clipboard.writeText(
      `${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`
    );
  };

  const handleReportPhotosChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setReportPhotos((prev) => [...prev, ...files]);

    // Чтобы можно было выбрать те же файлы повторно
    e.target.value = '';
  };

  useEffect(() => {
    const urls = reportPhotos.map((f) => URL.createObjectURL(f));
    setReportPhotoPreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [reportPhotos]);

  const handlePublishReport = () => {
    // Заглушка отправки обращения
    console.log('Новое обращение', {
      rubric: selectedRubric,
      marker,
      title: reportTitle,
      text: reportText,
      photos: reportPhotos,
    });
    setReportTitle('');
    setReportText('');
    setReportPhotos([]);
    setSelectedRubric(null);
    setRubricStep('select');
    closeSheet();
  };

  const getCurrentReportPayload = () => ({
    rubric: selectedRubric,
    marker,
    title: reportTitle,
    text: reportText,
    photos: reportPhotos,
  });

  const buildReportHtml = () => {
    const payload = getCurrentReportPayload();
    const createdAt = new Date().toLocaleString('ru-RU');

    const rubric = payload.rubric ? payload.rubric.title : 'Не выбрана';
    const address = payload.marker?.address ?? 'Адрес не указан';
    const coords = payload.marker
      ? `${payload.marker.lat.toFixed(6)}, ${payload.marker.lng.toFixed(6)}`
      : 'Не указаны';

    const title = payload.title || 'Без темы';
    const text = payload.text || 'Текст не указан';

    return [
      '<p style="margin:0 0 4px 0; font-weight:600;">Обращение гражданина</p>',
      '<p style="margin:0 0 12px 0;">=====================</p>',
      `<p style="margin:0 0 4px 0;"><strong>Дата создания:</strong> ${createdAt}</p>`,
      '',
      `<p style="margin:8px 0 4px 0;"><strong>Рубрика:</strong> ${rubric}</p>`,
      `<p style="margin:0 0 4px 0;"><strong>Адрес:</strong> ${address}</p>`,
      `<p style="margin:0 0 4px 0;"><strong>Координаты:</strong> ${coords}</p>`,
      '',
      `<p style="margin:12px 0 4px 0;"><strong>Тема:</strong> ${title}</p>`,
      '',
      '<p style="margin:12px 0 4px 0;"><strong>Текст обращения:</strong></p>',
      `<p style="margin:0;">${text}</p>`,
    ]
      .filter(Boolean)
      .join('\n');
  };

  const handleSaveDraft = () => {
    // Заглушка: сохранение черновика внутри приложения
    console.log('Сохранить черновик обращения', getCurrentReportPayload());
  };

  const handleSaveToFiles = async () => {
    try {
      const html = buildReportHtml();
      const safeTitle = reportTitle.trim() || 'obrashenie';
      const timestamp = new Date()
        .toISOString()
        .replace(/[:.]/g, '-')
        .slice(0, 19);

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-10000px';
      container.style.top = '0';
      container.style.width = '600px';
      container.style.padding = '24px';
      container.style.background = '#ffffff';
      container.style.color = '#111827';
      container.style.fontFamily =
        'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
      container.style.fontSize = '12px';
      container.style.lineHeight = '1.5';
      container.style.whiteSpace = 'pre-wrap';
      container.innerHTML = html;

      if (reportPhotoPreviews[0]) {
        const photoTitle = document.createElement('div');
        photoTitle.style.marginTop = '16px';
        photoTitle.style.fontWeight = 'bold';
        photoTitle.textContent = 'Фото:';
        container.appendChild(photoTitle);

        const img = document.createElement('img');
        img.src = reportPhotoPreviews[0];
        img.alt = 'Фото из обращения';
        img.style.display = 'block';
        img.style.marginTop = '8px';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '500px';
        container.appendChild(img);
      }
      document.body.appendChild(container);

      const canvas = await html2canvas(container, {
        scale: 2,
        backgroundColor: '#ffffff',
      });

      document.body.removeChild(container);

      const imgData = canvas.toDataURL('image/png');

      const doc = new jsPDF({
        unit: 'pt',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 40;

      const availableWidth = pageWidth - margin * 2;
      const availableHeight = pageHeight - margin * 2;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(
        availableWidth / imgWidth,
        availableHeight / imgHeight
      );

      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;
      const offsetX = (pageWidth - renderWidth) / 2;
      const offsetY = margin;

      doc.addImage(
        imgData,
        'PNG',
        offsetX,
        offsetY,
        renderWidth,
        renderHeight
      );

      const filename = `${safeTitle}-${timestamp}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Не удалось сохранить обращение в файлы устройства', error);
    }
  };

  const handleSendEmail = () => {
    // Заглушка: отправка документа на email пользователя
    console.log('Отправить обращение на email пользователя', getCurrentReportPayload());
  };

  const handlePrint = () => {
    try {
      const baseHtml = buildReportHtml();
      const firstPhoto = reportPhotoPreviews[0];
      const photoHtml = firstPhoto
        ? `<div style="margin-top:16px;">
             <img src="${firstPhoto}" alt="Фото из обращения" style="max-width:100%;max-height:500px;margin-top:8px;" />
           </div>`
        : '';

      const printableHtml = `${baseHtml}${photoHtml}`;

      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const frameWindow = iframe.contentWindow;
      if (!frameWindow) {
        document.body.removeChild(iframe);
        console.error('Не удалось инициализировать окно печати');
        return;
      }

      frameWindow.document.open();
      frameWindow.document.write(`<!doctype html>
<html lang="ru">
  <head>
    <meta charSet="utf-8" />
    <title>Обращение для печати</title>
    <style>
      body {
        font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        font-size: 14px;
        line-height: 1.5;
        color: #111827;
        padding: 24px;
      }
      h1 {
        font-size: 20px;
        margin-bottom: 16px;
      }
      .content {
        white-space: normal;
      }
    </style>
  </head>
  <body>
    <h1>Обращение гражданина</h1>
    <div class="content">${printableHtml}</div>
  </body>
</html>`);
      frameWindow.document.close();

      iframe.onload = () => {
        try {
          frameWindow.focus();
          frameWindow.print();
        } finally {
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 1000);
        }
      };
    } catch (error) {
      console.error('Не удалось отправить обращение на печать', error);
    }
  };

  const zoomIn = () => {
    mapInstanceRef.current?.zoomIn();
  };
  const zoomOut = () => {
    mapInstanceRef.current?.zoomOut();
  };

  const openTab = (tab: Tab) => {
    if (tab === 'home') {
      // Нажатие на «Главная» просто скрывает вкладки
      setSheetMode(null);
      return;
    }
    setSheetDragY(0);
    setActiveTab(tab);
    if (tab === 'settings') {
      setSettingsView('main');
    }
    setSheetMode('tabs');
  };

  const closeSheet = () => {
    setSheetMode((prev) => {
      if (prev === 'marker' || prev === 'rubric') {
        setMarker(null);
      }
      return null;
    });
    if (closeSheetTimeoutRef.current) {
      clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }
    // Мгновенно возвращаем подсветку на «Главная» как базовую вкладку
    setActiveTab('home');
    // Сбрасываем смещение, чтобы следующее открытие начиналось из ровного положения.
    setSheetDragY(0);
  };

  const isSheetOpen = sheetMode !== null;

  // Мягкое закрытие: даём анимации контейнера плавно
  // уехать вниз так же, как при нажатии на фон / крестик.
  const softCloseSheet = () => {
    if (!isSheetOpen) return;
    if (closeSheetTimeoutRef.current) {
      clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }
    closeSheet();
  };

  // Блокируем зум страницы (pinch, ctrl+wheel) вне области карты,
  // чтобы зум оставался только на самой карте.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mapElement = mapRef.current;

    const isInsideMap = (target: EventTarget | null) => {
      if (!mapElement || !(target instanceof Node)) return false;
      return mapElement.contains(target);
    };

    const handleWheel = (event: WheelEvent) => {
      if (!event.ctrlKey) return;
      if (isInsideMap(event.target)) return;
      event.preventDefault();
    };

    const handleGesture = (event: Event) => {
      if (isInsideMap(event.target)) return;
      event.preventDefault();
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('gesturestart', handleGesture as EventListener, {
      passive: false,
    });
    window.addEventListener('gesturechange', handleGesture as EventListener, {
      passive: false,
    });
    window.addEventListener('gestureend', handleGesture as EventListener, {
      passive: false,
    });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('gesturestart', handleGesture as EventListener);
      window.removeEventListener('gesturechange', handleGesture as EventListener);
      window.removeEventListener('gestureend', handleGesture as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = document.documentElement;
    const storedPrimary = window.localStorage.getItem('theme-mode');
    const storedLegacy = window.localStorage.getItem('theme-simple');
    const stored = storedPrimary || storedLegacy;
    const prefersDark =
      window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const initial: 'light' | 'dark' =
      stored === 'light' || stored === 'dark'
        ? (stored as 'light' | 'dark')
        : prefersDark
          ? 'dark'
          : 'light';

    setThemeMode(initial);
    window.localStorage.setItem('theme-mode', initial);

    if (initial === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const applyTheme = (mode: 'light' | 'dark') => {
    const root = document.documentElement;
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('theme-mode', mode);
    window.localStorage.setItem('theme-simple', mode);
  };

  const toggleTheme = () => {
    const next: 'light' | 'dark' = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(next);
    applyTheme(next);
  };

  useEffect(() => {
    const container = mapRef.current;
    if (!container) return;

    const map = new maplibregl.Map({
      container,
      style: OSM_STYLE_LIGHT,
      center: [center.lng, center.lat],
      zoom,
    });

    map.addControl(new maplibregl.NavigationControl(), 'top-right');

    map.on('click', (e) => {
      handlePlaceMarker(e.lngLat.lat, e.lngLat.lng);
    });

    map.on('contextmenu', (e) => {
      e.preventDefault();
      handlePlaceMarker(e.lngLat.lat, e.lngLat.lng);
    });

    const cancelLongPress = () => {
      if (longPressRef.current.timer) {
        clearTimeout(longPressRef.current.timer);
        longPressRef.current.timer = null;
      }
      longPressRef.current.coords = null;
    };

    const handlePointerDown = (e: MapMouseEvent) => {
      if (e.originalEvent.button !== 0) return;
      const lngLat = e.lngLat;
      longPressRef.current.coords = { lat: lngLat.lat, lng: lngLat.lng };
      longPressRef.current.timer = setTimeout(() => {
        longPressRef.current.timer = null;
        const c = longPressRef.current.coords;
        if (c) handlePlaceMarker(c.lat, c.lng);
        longPressRef.current.coords = null;
      }, 600);
    };

    map.on('mousedown', handlePointerDown);
    map.on('mouseup', cancelLongPress);
    map.on('mouseleave', cancelLongPress);
    map.on('mousemove', (e) => {
      if (!longPressRef.current.timer || !longPressRef.current.coords) return;
      const c = longPressRef.current.coords;
      const dx = Math.abs(e.lngLat.lng - c.lng);
      const dy = Math.abs(e.lngLat.lat - c.lat);
      if (dx > 0.001 || dy > 0.001) cancelLongPress();
    });

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerInstanceRef.current = null;
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
        userLocationMarkerRef.current = null;
      }
      if (closeSheetTimeoutRef.current) {
        clearTimeout(closeSheetTimeoutRef.current);
        closeSheetTimeoutRef.current = null;
      }
    };
  }, [handlePlaceMarker]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.flyTo({ center: [center.lng, center.lat], zoom });
  }, [center, zoom]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (markerInstanceRef.current) {
      markerInstanceRef.current.remove();
      markerInstanceRef.current = null;
    }

    if (marker) {
      const el = document.createElement('div');
      el.className = 'map-marker';
      el.innerHTML = `
        <div style="
          position: relative;
          transform: translateY(-8px);
        ">
          <div style="
            width: 32px;
            height: 32px;
            background: #f43f5e;
            border-radius: 50% 50% 50% 0;
            border: 3px solid white;
            box-shadow: 0 4px 10px rgba(0,0,0,0.45);
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="
              width: 8px;
              height: 8px;
              background: white;
              border-radius: 50%;
            "></div>
          </div>
          <div style="
            position: absolute;
            left: 50%;
            bottom: -6px;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            background: white;
            border: 2px solid #f43f5e;
            transform: translateX(-50%);
          "></div>
        </div>
      `;
      const m = new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([marker.lng, marker.lat])
        .addTo(map);
      markerInstanceRef.current = m;

      m.getElement().addEventListener('contextmenu', (e) => {
        e.preventDefault();
        clearMarker();
      });
    }

    return () => {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.remove();
        markerInstanceRef.current = null;
      }
    };
  }, [marker]);

  const handleProfileWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollTop <= 0 && event.deltaY < 0) {
      event.preventDefault();
      softCloseSheet();
    }
  };

  const handleProfileTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    profileTouchStartYRef.current = event.touches[0]?.clientY ?? null;
    // На всякий случай сбрасываем смещение простыни,
    // чтобы жест начинался из ровного положения.
    setSheetDragY(0);
    setIsSheetDragging(false);
  };

  const handleProfileTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    const startY = profileTouchStartYRef.current;
    const el = profileScrollRef.current;
    if (startY == null || !el) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = currentY - startY;

    // Когда контент профиля уже в самом верху и пользователь тянет вниз,
    // начинаем "тащить" всю простыню, как в Яндекс.Картах.
    if (el.scrollTop <= 0 && delta > 0) {
      event.preventDefault();
      setIsSheetDragging(true);
      setSheetDragY(delta);
    }
  };

  return (
    <div className="fixed inset-0 z-0">
      <div
        ref={mapRef}
        className="h-full w-full [&_.maplibregl-ctrl-attrib]:!hidden bg-slate-200 dark:bg-[#1a1a1a]"
      />

      {/* Скрываем стандартные контролы MapLibre */}
      <style>{`
        .maplibregl-ctrl-group { display: none !important; }
      `}</style>

      {/* Аватар профиля в левом верхнем углу.
          Когда открыта полноэкранная вкладка, он уходит под затемнение
          и становится визуально неактивным, как карта. */}
      <button
        type="button"
        onClick={() => {
          if (isAuthenticated) {
            openTab('profile');
          } else {
            openTab('auth');
          }
        }}
        aria-label="Аккаунт"
        className={cn(
          'absolute top-4 left-4 z-[900] flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/90 text-slate-900 shadow-lg ring-1 ring-slate-200 dark:bg-black/85 dark:text-white dark:ring-white/10 focus:outline-none overflow-hidden transition-opacity duration-200',
          sheetMode === 'tabs' && isSheetOpen ? 'opacity-50' : 'opacity-100'
        )}
      >
        <span className="inline-flex rounded-full bg-gradient-to-tr from-rose-500 via-fuchsia-500 to-indigo-500 p-[2px]">
          <Avatar className="h-10 w-10 rounded-full overflow-hidden bg-white dark:bg-slate-800">
            {userProfile?.avatar_url && (
              <AvatarImage src={resolveAvatarUrl(userProfile.avatar_url) ?? ''} alt="" className="object-cover" />
            )}
            <AvatarFallback className="rounded-full bg-white text-slate-900 dark:bg-slate-800 dark:text-white">
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </span>
      </button>

      {/* Справа: zoom + фильтр доносов + геолокация */}
      <div className="absolute top-32 right-3 z-[950] flex flex-col gap-2">
        <button
          type="button"
          onClick={zoomIn}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-slate-900 shadow-lg border border-slate-200 dark:bg-[#1a1a1a]/95 dark:text-white dark:border-white/10"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={zoomOut}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-slate-900 shadow-lg border border-slate-200 dark:bg-[#1a1a1a]/95 dark:text-white dark:border-white/10"
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-slate-900 shadow-lg border border-slate-200 dark:bg-[#1a1a1a]/95 dark:text-white dark:border-white/10"
        >
          <Filter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLocateMe}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/95 text-slate-900 shadow-lg border border-slate-200 dark:bg-[#1a1a1a]/95 dark:text-white dark:border-white/10"
        >
          {locating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Navigation className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* Нижняя панель: навигация + поиск */}
      <div className="absolute inset-x-0 bottom-0 z-[900]">
        <div className="glass-dock w-full rounded-t-[28px] rounded-b-none px-4 pt-3 pb-2">
          {/* Поиск */}
          <div className="flex items-center gap-2 bg-white/95 dark:bg-[#111827] rounded-full px-3 py-2 border border-slate-200 dark:border-white/10">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
              placeholder="Поиск и выбор мест"
              className="flex-1 bg-transparent text-base text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-[#6b7280] outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSuggestions([]);
                  setShowSuggestions(false);
                  inputRef.current?.focus();
                }}
                className="text-[#6b7280] hover:text-slate-900 dark:text-[#9ca3af] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {loading && <Loader2 className="h-4 w-4 animate-spin text-sky-400" />}
          </div>

          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 dark:bg-[#020617] dark:border-white/10 overflow-hidden max-h-60 overflow-y-auto"
            >
              {suggestions.map((s, idx) => (
                <button
                  key={s.place_id ?? idx}
                  type="button"
                  onClick={() => handleSelectSuggestion(s)}
                  className="w-full px-4 py-3 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 flex items-start gap-3"
                >
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-sky-400" />
                  <span className="line-clamp-2">{s.display_name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-[#64748b]" />
                </button>
              ))}
            </div>
          )}
          {/* Навигация */}
          <div className="mt-2 flex items-center justify-between text-xs font-medium text-[#94a3b8]">
            <button
              type="button"
              onClick={() => openTab('home')}
              className={cn(
                'flex flex-col items-center flex-1 text-center',
                activeTab === 'home' ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
              )}
            >
              <Home className="h-4 w-4 mb-0.5" />
              <span>Главная</span>
            </button>
            <button
              type="button"
              onClick={() => openTab('my')}
              className={cn(
                'flex flex-col items-center flex-1 text-center',
                activeTab === 'my' ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
              )}
            >
              <FolderOpen className="h-4 w-4 mb-0.5" />
              <span>Мои обращения</span>
            </button>
            <button
              type="button"
              onClick={() => openTab('all')}
              className={cn(
                'flex flex-col items-center flex-1 text-center',
                activeTab === 'all' ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
              )}
            >
              <MessageCircle className="h-4 w-4 mb-0.5" />
              <span>Все обращения</span>
            </button>
            <button
              type="button"
              onClick={() => openTab('settings')}
              className={cn(
                'flex flex-col items-center flex-1 text-center',
                activeTab === 'settings' ? 'text-sky-400' : 'text-[#94a3b8] hover:text-white'
              )}
            >
              <Settings className="h-4 w-4 mb-0.5" />
              <span>Настройки</span>
            </button>
          </div>
        </div>
      </div>

      {/* Большая панель как в Яндекс.Картах */}
      <div
        className={cn(
          'absolute inset-0 z-[950] flex flex-col items-center justify-end pointer-events-none',
          isSheetOpen ? 'opacity-100' : 'opacity-0 transition-opacity duration-200'
        )}
      >
        {/* затемнение карты */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-250',
            isSheetOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={closeSheet}
        />

        {/* сама «простыня» */}
        <div
          className="relative w-full max-w-xl pointer-events-auto transform transition-transform duration-350 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
          style={{
            transform: isSheetOpen
              ? `translateY(${sheetDragY}px)`
              : 'translateY(calc(100% + 32px))',
            transition: isSheetDragging ? 'none' : undefined,
            touchAction: 'pan-y',
          }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
        >
          <div
            className={cn(
              'glass-dock rounded-t-[32px] rounded-b-none px-4 pt-3 pb-6 flex flex-col',
              sheetMode === 'marker'
                ? 'max-h-[65vh] overflow-hidden'
                : 'h-[calc(100vh-80px)] overflow-hidden'
            )}
          >
            {/* Drag handle */}
            <div
              data-sheet-drag-handle="true"
              className="flex items-center justify-center py-5 -mx-4"
            >
              <div className="h-1 w-12 rounded-full bg-slate-300/80 dark:bg-white/15" />
            </div>

            {sheetMode === 'marker' && marker ? (
              <div className="flex-1 overflow-y-auto overscroll-contain pb-2" data-sheet-scrollable="true">
                <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">
                  Выбранная точка
                </p>
                <h2 className="text-base font-semibold text-slate-900 dark:text-white line-clamp-3">
                  {marker.address ?? 'Адрес уточняется…'}
                </h2>
                <p className="text-xs text-slate-600 dark:text-[#9ca3af] mt-1 flex items-center gap-2">
                  {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                  <button
                    type="button"
                    onClick={copyCoords}
                    className="text-sky-600 hover:text-sky-500 dark:text-[#3b82f6] dark:hover:text-sky-400"
                  >
                    <Copy className="h-3 w-3" />
                  </button>
                </p>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleCreateReport}
                    className="w-full flex items-center gap-3 rounded-2xl bg-sky-50 hover:bg-sky-100 border border-sky-100 text-slate-900 dark:bg-[#0b1120] dark:hover:bg-white/5 dark:border-white/10 px-3 py-3 text-left text-sm dark:text-white transition-colors"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500 text-white">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Создать обращение</p>
                      <p className="text-xs text-[#94a3b8]">
                        Откроется выбор рубрики и оформление доноса
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-[#64748b]" />
                  </button>
                </div>
              </div>
            ) : sheetMode === 'rubric' && marker ? (
              <div
                className="flex-1 overflow-y-auto overscroll-contain pb-2 sheet-swap-enter"
                data-sheet-scrollable="true"
              >
                {!selectedRubric ? (
                  <>
                    <div className="mb-1 flex items-center justify-between gap-3">
                      <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                        Выбор рубрики
                      </h2>
                      <button
                        type="button"
                        onClick={closeSheet}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                        aria-label="Закрыть"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">
                      Выберите тип инцидента
                    </p>
                    <p className="text-xs text-slate-600 dark:text-[#94a3b8] mb-4">
                      По адресу {marker.address ?? 'адрес уточняется'}:{' '}
                      {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                    </p>

                    <div className="space-y-3">
                      {rubrics.map((rubric) => (
                        <button
                          key={rubric.id}
                          type="button"
                          onClick={() => {
                            setSelectedRubric(rubric);
                            setRubricStep('create');
                          }}
                          className="w-full group relative bg-white rounded-2xl border border-slate-200 hover:border-slate-300 dark:bg-[#020617] dark:border-white/10 dark:hover:border-white/20 transition-all overflow-hidden text-left"
                        >
                          <div
                            className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${rubric.color}`}
                          />
                          <div className="flex items-center p-5 pl-7">
                            <div
                              className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${rubric.color} flex items-center justify-center text-white opacity-90`}
                            >
                              {rubric.icon}
                            </div>
                            <div className="flex-1 text-left ml-4">
                              <h3 className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                                {rubric.title}
                              </h3>
                              <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2">
                                {rubric.description}
                              </p>
                            </div>
                            <ChevronRight className="h-4 w-4 text-[#64748b] group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                ) : rubricStep === 'create' ? (
                  selectedRubric && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRubricStep('select');
                            setSelectedRubric(null);
                          }}
                          className="text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
                        >
                          ← Назад к выбору рубрики
                        </button>
                        <button
                          type="button"
                          onClick={closeSheet}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                          aria-label="Закрыть"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">
                          Создание обращения
                        </p>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          {selectedRubric.title}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-1">
                          {marker.address ?? 'Адрес уточняется'} —{' '}
                          {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            Тема обращения
                          </label>
                          <input
                            type="text"
                            value={reportTitle}
                            onChange={(e) => setReportTitle(e.target.value)}
                            placeholder="Кратко опишите проблему"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-[#020617] dark:border-white/10 dark:text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            Текст обращения
                          </label>
                          <textarea
                            value={reportText}
                            onChange={(e) => setReportText(e.target.value)}
                            rows={4}
                            placeholder="Опишите, что произошло, когда и при каких условиях"
                            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none dark:bg-[#020617] dark:border-white/10 dark:text-white"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-medium text-slate-700 dark:text-slate-200">
                            Фото
                          </label>
                          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white/40 px-3 py-3 text-xs text-slate-600 hover:bg-slate-50 dark:border-white/10 dark:bg-[#020617] dark:text-[#94a3b8] dark:hover:bg-white/5">
                            <span>Добавить фото</span>
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleReportPhotosChange}
                            />
                          </label>
                          {reportPhotos.length > 0 && (
                            <p className="text-[11px] text-slate-500 dark:text-[#9ca3af]">
                              Выбрано файлов: {reportPhotos.length}
                            </p>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setRubricStep('preview')}
                        className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-sky-600 active:bg-sky-700 transition-colors"
                        disabled={!reportTitle || !reportText}
                      >
                        Далее
                      </button>
                    </div>
                  )
                ) : (
                  selectedRubric && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between gap-3">
                        <button
                          type="button"
                          onClick={() => setRubricStep('create')}
                          className="text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
                        >
                          ← Назад к редактированию
                        </button>
                        <button
                          type="button"
                          onClick={closeSheet}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                          aria-label="Закрыть"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">
                          Предпросмотр
                        </p>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          {reportTitle || 'Без темы'}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-1">
                          {selectedRubric.title} • {marker.address ?? 'Адрес уточняется'} •{' '}
                          {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
                        </p>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 dark:border-white/10 dark:bg-[#020617] dark:text-white">
                        <div className="whitespace-pre-wrap break-words">
                          {reportText || 'Текст не указан'}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-200">
                          Фото
                        </p>
                        {reportPhotoPreviews.length === 0 ? (
                          <p className="text-xs text-slate-500 dark:text-[#9ca3af]">Фото не добавлены</p>
                        ) : (
                          <>
                            <div className="w-32">
                              <img
                                src={reportPhotoPreviews[0]}
                                alt="Превью первого фото"
                                className="aspect-square w-full rounded-xl object-cover border border-slate-200 dark:border-white/10"
                              />
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-[#9ca3af]">
                              Всего фото: {reportPhotoPreviews.length}
                            </p>
                          </>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={handlePublishReport}
                        className="w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-medium text-white shadow-md hover:bg-sky-600 active:bg-sky-700 transition-colors"
                        disabled={!reportTitle || !reportText}
                      >
                        Опубликовать обращение
                      </button>

                      <div className="space-y-2 pt-1">
                        <p className="text-[11px] uppercase tracking-wide text-[#64748b]">
                          Дополнительные действия
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleSaveDraft}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#020617] dark:text-[#e5e7eb] dark:hover:bg-white/5"
                          >
                            В черновики приложения
                          </button>
                          <button
                            type="button"
                            onClick={handleSaveToFiles}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#020617] dark:text-[#e5e7eb] dark:hover:bg:white/5"
                          >
                            В документы смартфона
                          </button>
                          <button
                            type="button"
                            onClick={handleSendEmail}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-[#020617] dark:text-[#e5e7eb] dark:hover:bg:white/5"
                          >
                            На e‑mail пользователя
                          </button>
                          <button
                            type="button"
                            onClick={handlePrint}
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 dark:border:white/10 dark:bg-[#020617] dark:text-[#e5e7eb] dark:hover:bg:white/5"
                          >
                            Отправить на печать
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            ) : (
              <>
              <div
                className="flex-1 overflow-y-auto overscroll-contain space-y-4 pb-2"
                data-sheet-scrollable="true"
                ref={activeTab === 'profile' ? profileScrollRef : null}
                onWheel={activeTab === 'profile' ? handleProfileWheel : undefined}
                onTouchStart={activeTab === 'profile' ? handleProfileTouchStart : undefined}
                onTouchMove={activeTab === 'profile' ? handleProfileTouchMove : undefined}
              >
                  {activeTab === 'home' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          Главная
                        </h2>
                        <button
                          type="button"
                          onClick={closeSheet}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                          aria-label="Закрыть"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {Array.from({ length: 4 }).map((_, i) => (
                          <div
                            key={i}
                            className="min-w-[160px] rounded-2xl bg-white border border-slate-200 dark:bg-[#020617] dark:border-white/10 overflow-hidden"
                          >
                            <div className="h-24 bg-gradient-to-br from-sky-500/40 via-indigo-500/40 to-fuchsia-500/40" />
                            <div className="p-3">
                              <p className="text-xs text-slate-500 dark:text-[#9ca3af]">Заглушка карточки</p>
                              <p className="text-sm font-medium text-slate-900 dark:text-white mt-0.5">
                                Здесь будут подборки мест
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 dark:bg-[#020617] dark:border-white/10 p-3"
                          >
                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-900 dark:text-white">
                                Место #{i + 1}
                              </p>
                              <p className="text-xs text-[#9ca3af] mt-0.5">
                                Здесь будет краткое описание, рейтинг и т.д.
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {activeTab === 'my' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          Мои обращения
                        </h2>
                        <button
                          type="button"
                          onClick={closeSheet}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                          aria-label="Закрыть"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                        Заглушка страницы. Тут будет список ваших обращений и фильтры.
                      </p>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#020617] p-4">
                        <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                          Пока нет данных. Добавим список обращений позже.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'all' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          Все обращения
                        </h2>
                        <button
                          type="button"
                          onClick={closeSheet}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                          aria-label="Закрыть"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                        Здесь будет общий поток обращений (пока заглушка).
                      </p>
                      <div className="mt-2 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#020617] p-4">
                        <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                          Позже добавим ленту и фильтры по городу, району и типу инцидентов.
                        </p>
                      </div>
                    </div>
                  )}
                  {activeTab === 'profile' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                          Профиль
                        </h2>
                        <div className="flex items-center gap-2">
                          {isAuthenticated && (
                            <button
                              type="button"
                              onClick={() => {
                                window.localStorage.removeItem('userId');
                                window.localStorage.removeItem('authToken');
                                setIsAuthenticated(false);
                                setUserProfile(null);
                                openTab('auth');
                              }}
                              className="px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 dark:border-white/10 dark:bg-black/30 dark:text-[#cbd5f5] dark:hover:bg-white/5"
                            >
                              Выйти
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={closeSheet}
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                            aria-label="Закрыть"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {userProfile && userProfile.id && (
                        <ProfileTab
                          userId={userProfile.id}
                          onAvatarChange={(url) =>
                            setUserProfile((prev) =>
                              prev
                                ? { ...prev, avatar_url: url ?? prev.avatar_url ?? null }
                                : { avatar_url: url ?? null },
                            )
                          }
                        />
                      )}
                    </div>
                  )}
                  {activeTab === 'auth' && (
                    <AuthPanel
                      onAuthenticated={(payload) => {
                        setIsAuthenticated(true);
                        setUserProfile(payload);
                        openTab('profile');
                      }}
                      closeSheet={closeSheet}
                    />
                  )}
                  {activeTab === 'settings' && (
                    <div className="space-y-4">
                      {settingsView === 'main' && (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                              Настройки
                            </h2>
                            <button
                              type="button"
                              onClick={closeSheet}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                              aria-label="Закрыть настройки"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>

                          <div className="mt-1 rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#020617] p-4 flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">Тема приложения</p>
                              <p className="text-xs text-slate-600 dark:text-[#94a3b8]">
                                Переключение между светлой и тёмной темой
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={toggleTheme}
                              className={cn(
                                'relative inline-flex h-7 w-12 items-center rounded-full border border-white/15 px-1 transition-all',
                                themeMode === 'dark'
                                  ? 'bg-slate-900 text-sky-400'
                                  : 'bg-slate-100 text-amber-500'
                              )}
                            >
                              <span
                                className={cn(
                                  'inline-flex h-5 w-5 items-center justify-center rounded-full shadow-sm text-[11px] transition-transform',
                                  themeMode === 'dark'
                                    ? 'translate-x-5 bg-slate-800 text-sky-300'
                                    : 'translate-x-0 bg-white text-amber-500'
                                )}
                              >
                                {themeMode === 'dark' ? '🌙' : '☀️'}
                              </span>
                            </button>
                          </div>

                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => setSettingsView('about')}
                              className="w-full flex items-center justify-between rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#020617] dark:hover:bg-white/5 dark:border-white/10 px-4 py-3 text-left text-sm dark:text-white transition-colors"
                            >
                              <div>
                                <p className="font-medium">О проекте</p>
                                <p className="text-xs text-[#94a3b8]">
                                  Краткая информация о задумке и целях
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-[#64748b]" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSettingsView('feedback')}
                              className="w-full flex items-center justify-between rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-900 dark:bg-[#020617] dark:hover:bg:white/5 dark:border-white/10 px-4 py-3 text-left text-sm dark:text-white transition-colors"
                            >
                              <div>
                                <p className="font-medium">Обратная связь</p>
                                <p className="text-xs text-[#94a3b8]">
                                  Как связаться с командой проекта
                                </p>
                              </div>
                              <ChevronRight className="h-4 w-4 text-[#64748b]" />
                            </button>
                          </div>
                        </>
                      )}

                      {settingsView === 'about' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setSettingsView('main')}
                              className="text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
                            >
                              ← Назад к настройкам
                            </button>
                            <button
                              type="button"
                              onClick={closeSheet}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                              aria-label="Закрыть"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <h2 className="text-base font-semibold text-slate-900 dark:text-white">О проекте</h2>
                          <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                            Заглушка страницы. Здесь будет описание сервиса, его целей и того, как
                            лучше всего им пользоваться.
                          </p>
                        </div>
                      )}

                      {settingsView === 'feedback' && (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => setSettingsView('main')}
                              className="text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
                            >
                              ← Назад к настройкам
                            </button>
                            <button
                              type="button"
                              onClick={closeSheet}
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
                              aria-label="Закрыть"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          <h2 className="text-base font-semibold text-slate-900 dark:text-white">Обратная связь</h2>
                          <p className="text-sm text-slate-600 dark:text-[#94a3b8]">
                            Заглушка страницы. Здесь позже появятся формы и контакты для связи с
                            разработчиками проекта.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type AuthResponseUser = {
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string | null;
};

type AuthPanelProps = {
  onAuthenticated: (user: AuthResponseUser | null) => void;
  closeSheet: () => void;
};

function AuthPanel({ onAuthenticated, closeSheet }: AuthPanelProps) {
  const translateAuthError = (raw: unknown, fallback: string) => {
    const msg =
      (typeof raw === 'string' && raw) ||
      ((raw as { error?: string })?.error ??
        (raw as { message?: string })?.message ??
        (raw as { detail?: string })?.detail ??
        '');

    if (!msg) return fallback;

    const low = msg.toLowerCase();

    if (low.includes('invalid credentials') || low.includes('wrong password')) {
      return 'Неверный логин или пароль.';
    }
    if (low.includes('user is blocked') || low.includes('user blocked')) {
      return 'Пользователь заблокирован. Обратитесь в поддержку.';
    }
    if (low.includes('user not found')) {
      return 'Пользователь не найден.';
    }
    if (low.includes('invalid code')) {
      return 'Неверный код.';
    }
    if (low.includes('code expired')) {
      return 'Код просрочен. Запросите новый.';
    }

    if (low.includes('email already exists') || low.includes('email already exist')) {
      return 'Пользователь с такой почтой уже зарегистрирован.';
    }
    if (low.includes('phone already exists') || low.includes('phone already exist')) {
      return 'Пользователь с таким телефоном уже зарегистрирован.';
    }

    return msg || fallback;
  };
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [login, setLogin] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [lastName, setLastName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [street, setStreet] = useState('');
  const [house, setHouse] = useState('');
  const [apartment, setApartment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'sending' | 'sent' | 'resetting'>('idle');
  const [forgotStep, setForgotStep] = useState<'email' | 'reset'>('email');
  const [forgotCode, setForgotCode] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotNewPassword2, setForgotNewPassword2] = useState('');

  const [confirmEmailOpen, setConfirmEmailOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');
  const [confirmEmailCode, setConfirmEmailCode] = useState('');
  const [confirmEmailStatus, setConfirmEmailStatus] =
    useState<'idle' | 'sending' | 'verifying'>('idle');

  const API_PREFIX = '/v1';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await fetch(`${API_PREFIX}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            identifier: identifier.trim(),
            password,
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const raw =
            (json && (json as { error?: string; message?: string; detail?: string }).error) ||
            (json && (json as { error?: string; message?: string; detail?: string }).message) ||
            (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
            null;
          const msg = translateAuthError(
            raw,
            'Не удалось выполнить вход. Проверьте данные и попробуйте ещё раз.'
          );
          throw new Error(msg);
        }

        const user = (await res.json()) as AuthResponseUser | null;
        if (!user?.id) {
          throw new Error('Не удалось получить пользователя после входа.');
        }

        if (typeof window !== 'undefined') {
          window.localStorage.setItem('userId', String(user.id));
        }

        onAuthenticated(user);
        closeSheet();
      } else {
        const res = await fetch(`${API_PREFIX}/users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            login,
            email,
            password,
            last_name: lastName,
            first_name: firstName,
            middle_name: middleName || undefined,
            phone,
            city,
            street,
            house,
            apartment: apartment || undefined,
            is_blocked: false,
            role: 'user',
          }),
        });

        if (!res.ok) {
          const json = await res.json().catch(() => null);
          const raw =
            (json && (json as { error?: string; message?: string; detail?: string }).error) ||
            (json && (json as { error?: string; message?: string; detail?: string }).message) ||
            (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
            null;
          const msg = translateAuthError(
            raw,
            'Не удалось выполнить запрос. Проверьте данные и попробуйте ещё раз.'
          );
          throw new Error(msg);
        }

        const created = (await res.json().catch(() => null)) as AuthResponseUser | null;
        const targetEmail = created?.email || email;

        if (targetEmail) {
          setConfirmEmail(targetEmail);
          setConfirmEmailOpen(true);
          setConfirmEmailCode('');
          setConfirmEmailStatus('sending');

          void fetch(`${API_PREFIX}/users/email-code/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: targetEmail, purpose: 'register' }),
          })
            .then(async (sendRes) => {
              if (!sendRes.ok) {
                const json = await sendRes.json().catch(() => null);
                const raw =
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).error) ||
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).message) ||
                  (json &&
                    (json as { error?: string; message?: string; detail?: string }).detail) ||
                  null;
                const msg = translateAuthError(
                  raw,
                  'Не удалось отправить код для подтверждения почты.'
                );
                setError(msg);
                setConfirmEmailStatus('idle');
                setConfirmEmailOpen(false);
                return;
              }
              setConfirmEmailStatus('idle');
              setSuccess('Мы отправили код на вашу почту. Введите его для подтверждения аккаунта.');
            })
            .catch(() => {
              setConfirmEmailStatus('idle');
              setError('Не удалось отправить код для подтверждения почты.');
              setConfirmEmailOpen(false);
            });
        } else {
          setSuccess('Аккаунт создан. Теперь войдите под своими данными.');
          setMode('login');
          if (created?.email) setIdentifier(created.email);
        }
      }
    } catch (err) {
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetCode = async () => {
    const target = forgotEmail.trim();
    if (!target) {
      setError('Введите почту.');
      return;
    }

    setError(null);
    setSuccess(null);
    setForgotStatus('sending');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/send-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: target }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(
          raw,
          'Не удалось отправить код. Проверьте почту и попробуйте ещё раз.'
        );
        throw new Error(msg);
      }

      setForgotStatus('sent');
      setSuccess('Код отправлен на почту. Проверьте входящие.');
      setForgotStep('reset');
    } catch (err) {
      setForgotStatus('idle');
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  const handleResetPassword = async () => {
    const email = forgotEmail.trim();
    const code = forgotCode.trim();
    const p1 = forgotNewPassword;
    const p2 = forgotNewPassword2;

    if (!email) {
      setError('Введите почту.');
      return;
    }
    if (!code) {
      setError('Введите код из письма.');
      return;
    }
    if (!p1 || p1.length < 6) {
      setError('Пароль слишком короткий (минимум 6 символов).');
      return;
    }
    if (p1 !== p2) {
      setError('Пароли не совпадают.');
      return;
    }

    setError(null);
    setSuccess(null);
    setForgotStatus('resetting');
    try {
      const res = await fetch(`${API_PREFIX}/users/password-reset/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: p1 }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(
          raw,
          'Не удалось сменить пароль. Проверьте код и попробуйте ещё раз.'
        );
        throw new Error(msg);
      }

      setSuccess('Пароль обновлён. Теперь войдите с новым паролем.');
      setForgotOpen(false);
      setForgotStatus('idle');
      setForgotStep('email');
      setForgotCode('');
      setForgotNewPassword('');
      setForgotNewPassword2('');
      setPassword('');
      setMode('login');
    } catch (err) {
      setForgotStatus('sent');
      const fallback = 'Ошибка запроса. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  const handleConfirmEmail = async () => {
    const emailValue = confirmEmail.trim() || email.trim();
    const code = confirmEmailCode.trim();

    if (!emailValue) {
      setError('Не удалось определить почту для подтверждения.');
      return;
    }
    if (!code) {
      setError('Введите код из письма.');
      return;
    }

    setError(null);
    setSuccess(null);
    setConfirmEmailStatus('verifying');

    try {
      const res = await fetch(`${API_PREFIX}/users/email-code/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailValue,
          purpose: 'register',
          code,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        const raw =
          (json && (json as { error?: string; message?: string; detail?: string }).error) ||
          (json && (json as { error?: string; message?: string; detail?: string }).message) ||
          (json && (json as { error?: string; message?: string; detail?: string }).detail) ||
          null;
        const msg = translateAuthError(raw, 'Неверный или просроченный код.');
        throw new Error(msg);
      }

      setConfirmEmailStatus('idle');
      setConfirmEmailOpen(false);
      setSuccess('Почта подтверждена. Теперь войдите под своими данными.');
      setMode('login');
      if (emailValue) {
        setIdentifier(emailValue);
      }
    } catch (err) {
      setConfirmEmailStatus('idle');
      const fallback = 'Не удалось подтвердить почту. Попробуйте ещё раз.';
      const msg =
        err instanceof Error
          ? translateAuthError(err.message, fallback)
          : translateAuthError(null, fallback);
      setError(msg);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 scale-100">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">
          {confirmEmailOpen
            ? 'Подтверждение почты'
            : forgotOpen
            ? 'Восстановление пароля'
            : mode === 'login'
            ? 'Вход в аккаунт'
            : 'Регистрация'}
        </h2>
        <button
          type="button"
          onClick={closeSheet}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
          aria-label="Закрыть"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {!forgotOpen && !confirmEmailOpen && (
        <div className="flex gap-2 text-xs font-medium">
          <button
            type="button"
            className={cn(
              'flex-1 rounded-full px-3 py-2 border transition-colors',
              mode === 'login'
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-transparent text-slate-600 dark:text-[#94a3b8] border-slate-300 dark:border-slate-700'
            )}
            onClick={() => setMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded-full px-3 py-2 border transition-colors',
              mode === 'register'
                ? 'bg-sky-500 text-white border-sky-500'
                : 'bg-transparent text-slate-600 dark:text-[#94a3b8] border-slate-300 dark:border-slate-700'
            )}
            onClick={() => setMode('register')}
          >
            Регистрация
          </button>
        </div>
      )}

      {confirmEmailOpen ? (
        <div className="space-y-3">
          <p className="text-[11px] text-slate-600 dark:text-[#94a3b8]">
            На вашу почту{' '}
            <span className="font-semibold text-slate-900 dark:text-white">
              {confirmEmail || email}
            </span>{' '}
            отправлен код подтверждения. Введите его, чтобы завершить регистрацию.
          </p>

          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Код из письма
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={confirmEmailCode}
              onChange={(e) => setConfirmEmailCode(e.target.value)}
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
              placeholder="123456"
            />
          </div>

          <button
            type="button"
            onClick={handleConfirmEmail}
            disabled={confirmEmailStatus === 'verifying'}
            className="mt-1 w-full rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 shadow-md shadow-sky-500/40"
          >
            {confirmEmailStatus === 'verifying' ? 'Проверка…' : 'Подтвердить почту'}
          </button>

          <button
            type="button"
            onClick={() => {
              if (!confirmEmail) return;
              setConfirmEmailStatus('sending');
              void fetch(`${API_PREFIX}/users/email-code/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: confirmEmail, purpose: 'register' }),
              })
                .then(async (res) => {
                  if (!res.ok) {
                    const json = await res.json().catch(() => null);
                    const raw =
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).error) ||
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).message) ||
                      (json &&
                        (json as { error?: string; message?: string; detail?: string }).detail) ||
                      null;
                    const msg = translateAuthError(
                      raw,
                      'Не удалось отправить код. Проверьте почту и попробуйте ещё раз.'
                    );
                    setError(msg);
                  } else {
                    setSuccess('Код повторно отправлен на почту.');
                  }
                })
                .catch(() => {
                  setError('Не удалось отправить код. Попробуйте ещё раз.');
                })
                .finally(() => {
                  setConfirmEmailStatus('idle');
                });
            }}
            disabled={confirmEmailStatus !== 'idle'}
            className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
          >
            Отправить код ещё раз
          </button>

          <button
            type="button"
            onClick={() => {
              setConfirmEmailOpen(false);
              setConfirmEmailCode('');
              setConfirmEmailStatus('idle');
            }}
            className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
          >
            ← Назад к регистрации
          </button>
        </div>
      ) : forgotOpen ? (
        <div className="space-y-3">
          {forgotStep === 'email' ? (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Почта
              </p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                placeholder="you@example.com"
              />
              <p className="text-[11px] text-slate-500 dark:text-[#94a3b8]">
                Мы отправим код восстановления на эту почту.
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Почта
                </p>
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="you@example.com"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Код из письма
                </p>
                <input
                  type="text"
                  inputMode="numeric"
                  value={forgotCode}
                  onChange={(e) => setForgotCode(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="123456"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Новый пароль
                </p>
                <input
                  type="password"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="Минимум 6 символов"
                />
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Повтор пароля
                </p>
                <input
                  type="password"
                  value={forgotNewPassword2}
                  onChange={(e) => setForgotNewPassword2(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="Повторите пароль"
                />
              </div>
            </>
          )}

          {success && (
            <p className="text-[11px] text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/40 rounded-lg px-3 py-2">
              {success}
            </p>
          )}

          {error && (
            <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {forgotStep === 'email' ? (
            <button
              type="button"
              onClick={handleSendResetCode}
              disabled={forgotStatus === 'sending'}
              className="mt-1 w-full rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 shadow-md shadow-sky-500/40"
            >
              {forgotStatus === 'sending' ? 'Отправка…' : 'Отправить код'}
            </button>
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleResetPassword}
                disabled={forgotStatus === 'resetting'}
                className="mt-1 w-full rounded-2xl bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 shadow-md shadow-sky-500/40"
              >
                {forgotStatus === 'resetting' ? 'Сохранение…' : 'Сменить пароль'}
              </button>
              <button
                type="button"
                onClick={handleSendResetCode}
                disabled={forgotStatus === 'sending' || forgotStatus === 'resetting'}
                className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
              >
                Отправить код ещё раз
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              setForgotOpen(false);
              setForgotStatus('idle');
              setForgotStep('email');
              setForgotEmail('');
              setForgotCode('');
              setForgotNewPassword('');
              setForgotNewPassword2('');
              setError(null);
              setSuccess(null);
            }}
            className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
          >
            ← Назад ко входу
          </button>
        </div>
      ) : (
      <form onSubmit={handleSubmit} className="space-y-3">
        {mode === 'login' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Логин / почта / телефон
            </p>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
              placeholder="user123 / you@example.com / +79991234567"
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Логин
            </p>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
              placeholder="Ваш логин"
            />
          </div>
        )}

        {mode === 'register' && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
              Почта
            </p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
              placeholder="you@example.com"
            />
          </div>
        )}

        <div className="space-y-1">
          <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
            Пароль
          </p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
            placeholder="Минимум 6 символов"
          />
        </div>

        {mode === 'register' && (
          <>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Фамилия
              </p>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                placeholder="Иванов"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Имя
              </p>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                placeholder="Иван"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Отчество (необязательно)
              </p>
              <input
                type="text"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                placeholder="Иванович"
              />
            </div>

            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                Телефон
              </p>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                placeholder="+79991234567"
              />
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <div className="space-y-1 sm:col-span-3">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Город
                </p>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="Москва"
                />
              </div>
              <div className="space-y-1 sm:col-span-3">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Улица
                </p>
                <input
                  type="text"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="Тверская"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Дом
                </p>
                <input
                  type="text"
                  value={house}
                  onChange={(e) => setHouse(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="1"
                />
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-[#94a3b8] tracking-wide">
                  Квартира (необязательно)
                </p>
                <input
                  type="text"
                  value={apartment}
                  onChange={(e) => setApartment(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-white/10 bg-white/90 dark:bg-black/40 px-3 py-2 text-base text-slate-900 dark:text-slate-50 outline-none"
                  placeholder="10"
                />
              </div>
            </div>
          </>
        )}

        {success && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/40 rounded-lg px-3 py-2">
            {success}
          </p>
        )}

        {error && (
          <p className="text-[11px] text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/40 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-1 w-full rounded-xl bg-sky-500 hover:bg-sky-600 disabled:opacity-70 disabled:cursor-not-allowed text-white text-xs font-semibold px-4 py-2 shadow-md shadow-sky-500/40"
        >
          {loading
            ? 'Отправка...'
            : mode === 'login'
            ? 'Войти'
            : 'Зарегистрироваться'}
        </button>

        {mode === 'login' && (
          <button
            type="button"
            onClick={() => {
              setForgotOpen(true);
              setForgotEmail('');
              setForgotStatus('idle');
              setError(null);
              setSuccess(null);
            }}
            className="w-full text-xs text-slate-600 hover:text-slate-900 dark:text-[#94a3b8] dark:hover:text-white"
          >
            Забыли пароль?
          </button>
        )}
      </form>
      )}
    </div>
  );
}
