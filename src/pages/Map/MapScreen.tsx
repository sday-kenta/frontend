import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  Car,
  ShoppingBag,
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { cn, resolveAvatarUrl } from '@/lib/utils';
import ProfileTabComponent from '@/components/ProfileTab';
import { MapControls } from '@/components/map/MapControls';
import { SearchInputBar } from '@/components/map/SearchInputBar';
import { QuickSearchChips } from '@/components/map/QuickSearchChips';
import { SearchSuggestionsList } from '@/components/map/SearchSuggestionsList';
import { MapSearchPanel } from '@/components/map/MapSearchPanel';
import { MapSearchExpandedContent } from '@/components/map/MapSearchExpandedContent';
import { AuthPanel } from '@/components/map/AuthPanel';
import { MapProfileFab } from '@/components/map/MapProfileFab';
import { MapMarkerSheetContent } from '@/components/map/MapMarkerSheetContent';
import { MapRubricSheetContent } from '@/components/map/MapRubricSheetContent';
import { MapTabsSheetContent } from '@/components/map/MapTabsSheetContent';

const ProfileTab = ProfileTabComponent as ComponentType<{
  userId: number;
  onAvatarChange?: (url: string | null) => void;
  onOpenMyReports?: () => void;
  onOpenSettings?: () => void;
}>;

interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  place_id?: number;
}

type IncidentPreview = {
  id: number;
  title: string;
  category: string;
  status: string;
  lat: number;
  lng: number;
};

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

const INCIDENT_PREVIEWS: IncidentPreview[] = [
  {
    id: 1,
    title: 'Незаконная парковка на тротуаре',
    category: 'Парковка',
    status: 'В работе',
    lat: 53.2019,
    lng: 50.1572,
  },
  {
    id: 2,
    title: 'Просроченные продукты в магазине',
    category: 'Торговля',
    status: 'Новая',
    lat: 53.1945,
    lng: 50.1485,
  },
  {
    id: 3,
    title: 'Мусор у контейнерной площадки',
    category: 'Благоустройство',
    status: 'Проверка',
    lat: 53.2061,
    lng: 50.1638,
  },
  {
    id: 4,
    title: 'Опасная яма на дороге',
    category: 'Дороги',
    status: 'В работе',
    lat: 53.2103,
    lng: 50.1429,
  },
  {
    id: 5,
    title: 'Неубранный снег у остановки',
    category: 'Благоустройство',
    status: 'Новая',
    lat: 53.1983,
    lng: 50.1521,
  },
  {
    id: 6,
    title: 'Повреждённый дорожный знак',
    category: 'Дороги',
    status: 'Проверка',
    lat: 53.2052,
    lng: 50.1467,
  },
  {
    id: 7,
    title: 'Шум ночью во дворе',
    category: 'Общественный порядок',
    status: 'Новая',
    lat: 53.1928,
    lng: 50.1605,
  },
  {
    id: 8,
    title: 'Сломанная детская площадка',
    category: 'Благоустройство',
    status: 'В работе',
    lat: 53.2088,
    lng: 50.1542,
  },
  {
    id: 9,
    title: 'Нелегальная торговля у метро',
    category: 'Торговля',
    status: 'Проверка',
    lat: 53.1964,
    lng: 50.1399,
  },
  {
    id: 10,
    title: 'Неработающее освещение на переходе',
    category: 'Дороги',
    status: 'В работе',
    lat: 53.2131,
    lng: 50.1506,
  },
  {
    id: 11,
    title: 'Скопление мусора у подъезда',
    category: 'ЖКХ',
    status: 'Новая',
    lat: 53.2027,
    lng: 50.1664,
  },
  {
    id: 12,
    title: 'Парковка на газоне',
    category: 'Парковка',
    status: 'Проверка',
    lat: 53.1909,
    lng: 50.1474,
  },
  {
    id: 13,
    title: 'Стихийная свалка в лесополосе',
    category: 'Экология',
    status: 'Новая',
    lat: 53.2162,
    lng: 50.1598,
  },
  {
    id: 14,
    title: 'Яма на тротуаре возле школы',
    category: 'Дороги',
    status: 'В работе',
    lat: 53.1997,
    lng: 50.1446,
  },
  {
    id: 15,
    title: 'Протечка воды во дворе',
    category: 'ЖКХ',
    status: 'Проверка',
    lat: 53.2074,
    lng: 50.1418,
  },
];

const QUICK_SEARCH_CHIPS = ['Парковка', 'Просрочка', 'ЖКХ', 'Дороги', 'Мусор рядом'];

type IncidentDetails = {
  description: string;
  tags: string[];
  photoUrls: string[];
};

const INCIDENT_DETAILS: Record<number, IncidentDetails> = {
  1: {
    description: 'Автомобиль регулярно оставляют на тротуаре, пешеходам и коляскам приходится обходить по проезжей части.',
    tags: ['парковка', 'тротуар', 'безопасность'],
    photoUrls: [
      'https://picsum.photos/seed/incident-1/960/540',
      'https://picsum.photos/seed/incident-1b/960/540',
    ],
  },
  2: {
    description: 'В торговом зале обнаружены продукты с истекшим сроком годности. Нужна проверка магазина.',
    tags: ['торговля', 'просрочка', 'правапотребителей'],
    photoUrls: [
      'https://picsum.photos/seed/incident-2/960/540',
      'https://picsum.photos/seed/incident-2b/960/540',
    ],
  },
  3: {
    description: 'Контейнерная площадка переполнена, мусор разлетается по двору и создает антисанитарию.',
    tags: ['жкх', 'мусор', 'двор'],
    photoUrls: [
      'https://picsum.photos/seed/incident-3/960/540',
      'https://picsum.photos/seed/incident-3b/960/540',
    ],
  },
};

function calculateDistanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
}

function getProfileIncidentCategoryTagClass(category: string) {
  const normalized = category.toLowerCase();

  if (normalized.includes('дорог')) {
    return 'border-amber-300/60 bg-amber-100/70 text-amber-700 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200';
  }
  if (normalized.includes('парков')) {
    return 'border-sky-300/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200';
  }
  if (normalized.includes('жкх') || normalized.includes('благо')) {
    return 'border-emerald-300/60 bg-emerald-100/70 text-emerald-700 dark:border-emerald-400/40 dark:bg-emerald-500/20 dark:text-emerald-200';
  }
  if (normalized.includes('торгов')) {
    return 'border-orange-300/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200';
  }

  return 'border-violet-300/60 bg-violet-100/70 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200';
}

function getProfileIncidentStatusTagClass(status: string) {
  const normalized = status.toLowerCase();

  if (normalized.includes('нов')) {
    return 'border-sky-300/60 bg-sky-100/70 text-sky-700 dark:border-sky-400/40 dark:bg-sky-500/20 dark:text-sky-200';
  }
  if (normalized.includes('работ')) {
    return 'border-orange-300/60 bg-orange-100/70 text-orange-700 dark:border-orange-400/40 dark:bg-orange-500/20 dark:text-orange-200';
  }

  return 'border-violet-300/60 bg-violet-100/70 text-violet-700 dark:border-violet-400/40 dark:bg-violet-500/20 dark:text-violet-200';
}

function getTagIcon(tag: string) {
  const normalized = tag.toLowerCase().replace(/^#/, '');

  if (normalized.includes('жкх') || normalized.includes('благо') || normalized.includes('двор')) return '🏠';
  if (normalized.includes('дорог') || normalized.includes('яма') || normalized.includes('тротуар')) return '🛣️';
  if (normalized.includes('парков') || normalized.includes('авто')) return '🚗';
  if (normalized.includes('торгов') || normalized.includes('магаз') || normalized.includes('просроч')) return '🛒';
  if (normalized.includes('эко') || normalized.includes('мусор') || normalized.includes('свалк')) return '🌿';

  return '📍';
}

function normalizeFilterToken(value: string) {
  return value.toLowerCase().replace(/^#/, '').trim();
}

function matchesIncidentByTagFilter(incident: IncidentPreview, normalizedFilter: string) {
  if (!normalizedFilter) return true;

  const details = INCIDENT_DETAILS[incident.id];
  const searchableParts = [incident.title, incident.category, ...(details?.tags ?? [])].map(normalizeFilterToken);

  return searchableParts.some(
    (part) => part.includes(normalizedFilter) || normalizedFilter.includes(part)
  );
}

function getStatusIcon(status: string) {
  const normalized = status.toLowerCase();
  if (normalized.includes('нов')) return '🆕';
  if (normalized.includes('работ')) return '🛠️';
  if (normalized.includes('провер')) return '🔎';
  return 'ℹ️';
}

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
type SearchPanelSnap = 'collapsed' | 'half' | 'full';

export default function MapScreen() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);
  const markerInstanceRef = useRef<maplibregl.Marker | null>(null);
  const userLocationMarkerRef = useRef<maplibregl.Marker | null>(null);
  const incidentMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [center, setCenter] = useState({ lat: 53.2, lng: 50.15 });
  const centerRef = useRef(center);
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
  const [settingsView, setSettingsView] = useState<'main' | 'about' | 'feedback' | 'profile'>('main');
  const [pushNotificationsEnabled, setPushNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('notifications-push') !== 'false';
  });
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem('notifications-email') !== 'false';
  });
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
    email?: string;
    avatar_url?: string | null;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!window.localStorage.getItem('userId');
  });
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [localAvatarPreviewUrl, setLocalAvatarPreviewUrl] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileAvatarInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const closeSheetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sheetDragStartYRef = useRef<number | null>(null);
  const [sheetDragY, setSheetDragY] = useState(0);
  const [isSheetDragging, setIsSheetDragging] = useState(false);
  const [isSheetClosing, setIsSheetClosing] = useState(false);
  const [searchPanelSnap, setSearchPanelSnap] = useState<SearchPanelSnap>('collapsed');
  const [searchPanelDragHeight, setSearchPanelDragHeight] = useState<number | null>(null);
  const [isSearchPanelDragging, setIsSearchPanelDragging] = useState(false);
  const [selectedMapTagFilter, setSelectedMapTagFilter] = useState<string | null>(null);
  const [selectedMapIncidentId, setSelectedMapIncidentId] = useState<number | null>(null);
  const [selectedProfileStatusFilter, setSelectedProfileStatusFilter] = useState<string>('Все');
  const [selectedProfileCategoryFilter, setSelectedProfileCategoryFilter] = useState<string>('Все');
  const [renderExpandedSearchContent, setRenderExpandedSearchContent] = useState(false);
  const profileScrollRef = useRef<HTMLDivElement | null>(null);
  const profileTouchStartYRef = useRef<number | null>(null);
  const searchPanelTouchStartYRef = useRef<number | null>(null);
  const searchPanelStartSnapRef = useRef<SearchPanelSnap>('collapsed');
  const searchPanelTouchTargetRef = useRef<HTMLElement | null>(null);
  const searchPanelCanDragRef = useRef(false);
  const searchPanelSettleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPanelContentShowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPanelContentHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchPanelDragRafRef = useRef<number | null>(null);
  const searchPanelPendingHeightRef = useRef<number | null>(null);
  const expandedSearchContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    centerRef.current = center;
  }, [center]);

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
          const currentCenter = centerRef.current;
          const withDistance: WithDist[] = data.map((s) => ({
            ...s,
            _dist:
              Math.pow(s.lat - currentCenter.lat, 2) +
              Math.pow(s.lng - currentCenter.lng, 2),
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
      []
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
            raw as {
              id?: number;
              first_name?: string;
              last_name?: string;
              email?: string;
              avatar_url?: string | null;
            },
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

  const handleSelectSuggestion = useCallback((s: GeocodingResult) => {
    setCenter({ lat: s.lat, lng: s.lng });
    setMarker({ lat: s.lat, lng: s.lng, address: s.display_name });
    setSelectedMapIncidentId(null);
    setQuery(s.display_name);
    setShowSuggestions(false);
  }, []);

  const handlePlaceMarker = useCallback((lat: number, lng: number) => {
    setMarker({ lat, lng });
    setCenter({ lat, lng });
    setSelectedMapIncidentId(null);
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

  const clearMarker = useCallback(() => {
    setMarker(null);
    setSelectedMapIncidentId(null);
    if (sheetMode === 'marker') {
      setSheetMode(null);
    }
  }, [sheetMode]);

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

  const handleLocateMe = useCallback(() => {
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
  }, []);

  const handleCreateReport = useCallback(() => {
    if (!marker) return;
    setSelectedRubric(null);
    setRubricStep('select');
    setSheetMode('rubric');
  }, [marker]);

  const nearbyIncidents = useMemo(
    () =>
      INCIDENT_PREVIEWS
        .map((incident) => {
          const distanceKm = calculateDistanceKm(center, {
            lat: incident.lat,
            lng: incident.lng,
          });

          return {
            ...incident,
            distanceKm,
            distanceLabel: distanceKm < 1 ? `${Math.round(distanceKm * 1000)} м` : `${distanceKm.toFixed(1)} км`,
          };
        })
        .sort((a, b) => a.distanceKm - b.distanceKm),
    [center]
  );

  const nearbyIncidentsById = useMemo(
    () => new Map(nearbyIncidents.map((incident) => [incident.id, incident])),
    [nearbyIncidents]
  );

  const normalizedSelectedMapTagFilter = useMemo(
    () => (selectedMapTagFilter ? normalizeFilterToken(selectedMapTagFilter) : ''),
    [selectedMapTagFilter]
  );

  const filteredNearbyIncidents = useMemo(
    () =>
      nearbyIncidents.filter((incident) => matchesIncidentByTagFilter(incident, normalizedSelectedMapTagFilter)),
    [nearbyIncidents, normalizedSelectedMapTagFilter]
  );

  const selectedMapIncident = useMemo(() => {
    if (selectedMapIncidentId == null) return null;

    const incidentWithDistance = nearbyIncidentsById.get(selectedMapIncidentId);
    if (incidentWithDistance) return incidentWithDistance;

    return INCIDENT_PREVIEWS.find((incident) => incident.id === selectedMapIncidentId) ?? null;
  }, [nearbyIncidentsById, selectedMapIncidentId]);

  const selectedMapIncidentDistanceLabel = useMemo(() => {
    if (selectedMapIncidentId == null) return null;
    return nearbyIncidentsById.get(selectedMapIncidentId)?.distanceLabel ?? null;
  }, [nearbyIncidentsById, selectedMapIncidentId]);

  const selectedMapIncidentDetails = useMemo(() => {
    if (!selectedMapIncident) return null;

    const details = INCIDENT_DETAILS[selectedMapIncident.id];
    if (details) return details;

    return {
      description: `Заявка по категории «${selectedMapIncident.category}». Статус: ${selectedMapIncident.status}. Требуется проверка ответственной службы и контроль выполнения.`,
      tags: [selectedMapIncident.category.toLowerCase().replace(/\s+/g, ''), 'обращение', 'контроль'],
      photoUrls: [
        `https://picsum.photos/seed/incident-${selectedMapIncident.id}/960/540`,
        `https://picsum.photos/seed/incident-${selectedMapIncident.id}-b/960/540`,
      ],
    };
  }, [selectedMapIncident]);

  const mapVisibleIncidents = useMemo(
    () =>
      INCIDENT_PREVIEWS.filter((incident) => matchesIncidentByTagFilter(incident, normalizedSelectedMapTagFilter)),
    [normalizedSelectedMapTagFilter]
  );

  const userActiveIncidents = useMemo(
    () => INCIDENT_PREVIEWS.filter((incident) => incident.status !== 'Закрыта').slice(0, 8),
    []
  );

  const userTrustProgress = useMemo(() => {
    const confirmed = INCIDENT_PREVIEWS.filter((incident) => {
      const lowStatus = incident.status.toLowerCase();
      return lowStatus.includes('провер') || lowStatus.includes('работ');
    }).length;

    const useful = INCIDENT_PREVIEWS.filter((incident) => incident.status.toLowerCase().includes('работ')).length;
    const reputationScore = 67;

    const level =
      reputationScore >= 85
        ? 'Эксперт'
        : reputationScore >= 60
          ? 'Надёжный'
          : reputationScore >= 35
            ? 'Активный'
            : 'Новичок';

    return { confirmed, useful, reputationScore, level };
  }, []);

  const profileStatusFilters = useMemo(() => ['Все', 'Новые', 'В работе', 'Проверка'], []);

  const profileCategoryFilters = useMemo(
    () => ['Все', ...Array.from(new Set(userActiveIncidents.map((incident) => incident.category)))],
    [userActiveIncidents]
  );

  const filteredUserActiveIncidents = useMemo(() => {
    return userActiveIncidents.filter((incident) => {
      const lowStatus = incident.status.toLowerCase();
      const statusMatch =
        selectedProfileStatusFilter === 'Все' ||
        (selectedProfileStatusFilter === 'Новые' && lowStatus.includes('нов')) ||
        (selectedProfileStatusFilter === 'В работе' && lowStatus.includes('работ')) ||
        (selectedProfileStatusFilter === 'Проверка' && lowStatus.includes('провер'));

      const categoryMatch =
        selectedProfileCategoryFilter === 'Все' || incident.category === selectedProfileCategoryFilter;

      return statusMatch && categoryMatch;
    });
  }, [selectedProfileCategoryFilter, selectedProfileStatusFilter, userActiveIncidents]);

  const openCreateReportFromSearch = useCallback(() => {
    const markerPoint = marker ?? {
      lat: center.lat,
      lng: center.lng,
      address: 'Точка в центре карты',
    };

    if (!marker) {
      setMarker(markerPoint);
    }

    setSelectedRubric(null);
    setRubricStep('select');
    setSheetMode('rubric');
    setShowSuggestions(false);
    setSearchPanelSnap('collapsed');
  }, [center.lat, center.lng, marker]);

  const handleQuickSearch = useCallback((value: string) => {
    setSelectedMapTagFilter((prev) => (prev === value ? null : value));
    setSearchPanelSnap((prev) => (prev === 'collapsed' ? 'half' : prev));
    setShowSuggestions(false);
  }, []);

  type IncidentSelectionTarget = Pick<IncidentPreview, 'id' | 'lat' | 'lng' | 'title'>;

  const focusIncidentOnMap = useCallback((incident: IncidentSelectionTarget) => {
    setSelectedMapIncidentId(incident.id);
    setCenter({ lat: incident.lat, lng: incident.lng });
    setMarker({
      lat: incident.lat,
      lng: incident.lng,
      address: incident.title,
    });
    setSearchPanelSnap('full');
    setShowSuggestions(false);
  }, []);

  const scheduleSearchPanelHeight = useCallback((nextHeight: number) => {
    searchPanelPendingHeightRef.current = nextHeight;

    if (searchPanelDragRafRef.current !== null) {
      return;
    }

    searchPanelDragRafRef.current = requestAnimationFrame(() => {
      const pendingHeight = searchPanelPendingHeightRef.current;
      searchPanelPendingHeightRef.current = null;
      searchPanelDragRafRef.current = null;

      if (pendingHeight == null) return;

      setSearchPanelDragHeight((prev) => {
        if (prev !== null && Math.abs(prev - pendingHeight) < 0.5) {
          return prev;
        }
        return pendingHeight;
      });
    });
  }, []);

  const copyCoords = useCallback(() => {
    if (!marker) return;
    navigator.clipboard.writeText(
      `${marker.lat.toFixed(6)}, ${marker.lng.toFixed(6)}`
    );
  }, [marker]);

  const normalizeAvatarValue = (raw: unknown): string | null => {
    if (typeof raw !== 'string' || !raw.trim()) return null;
    const value = raw.trim();
    if (value.startsWith('/v1/avatars/')) {
      return value.replace('/v1/avatars/', '');
    }
    return value;
  };

  const handleProfileAvatarFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userProfile?.id) return;

    const previewUrl = URL.createObjectURL(file);
    setLocalAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return previewUrl;
    });

    setIsAvatarUploading(true);

    const uploadCandidates = [
      `/v1/users/${userProfile.id}/avatar`,
      '/v1/avatars/upload',
      '/v1/avatars',
    ];

    let resolvedAvatar: string | null = null;
    let uploadedOnServer = false;

    for (const endpoint of uploadCandidates) {
      try {
        const formData = new FormData();
        formData.append('avatar', file);
        formData.append('file', file);
        formData.append('image', file);

        const res = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) continue;
        uploadedOnServer = true;

        const json = await res.json().catch(() => null);
        const payload = (json as { data?: Record<string, unknown> } | null)?.data ?? (json as Record<string, unknown> | null) ?? {};

        resolvedAvatar =
          normalizeAvatarValue(payload.avatar_url) ||
          normalizeAvatarValue(payload.avatar) ||
          normalizeAvatarValue(payload.filename) ||
          normalizeAvatarValue(payload.file) ||
          null;

        if (resolvedAvatar || uploadedOnServer) break;
      } catch {
        continue;
      }
    }

    if (uploadedOnServer && resolvedAvatar) {
      try {
        await fetch(`/v1/users/${userProfile.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ avatar_url: resolvedAvatar }),
        });
      } catch {
      }
    }

    if (uploadedOnServer) {
      try {
        const profileRes = await fetch(`/v1/users/${userProfile.id}`);
        if (profileRes.ok) {
          const json = await profileRes.json();
          const raw =
            Array.isArray(json) ? json[0] : (json as { data?: unknown }).data ?? json;

          if (raw && typeof raw === 'object') {
            setUserProfile(
              raw as {
                id?: number;
                first_name?: string;
                last_name?: string;
                email?: string;
                avatar_url?: string | null;
              },
            );
          }
        }
      } catch {
      }
    }

    setIsAvatarUploading(false);
    setLocalAvatarPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    event.target.value = '';
  };

  useEffect(() => {
    return () => {
      if (localAvatarPreviewUrl) {
        URL.revokeObjectURL(localAvatarPreviewUrl);
      }
    };
  }, [localAvatarPreviewUrl]);

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

  const zoomIn = useCallback(() => {
    mapInstanceRef.current?.zoomIn();
  }, []);

  const zoomOut = useCallback(() => {
    mapInstanceRef.current?.zoomOut();
  }, []);

  const closeSheet = useCallback(() => {
    if (isSheetClosing || sheetMode === null) return;

    if (closeSheetTimeoutRef.current) {
      clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }

    setIsSheetClosing(true);
    setIsSheetDragging(false);
    sheetDragStartYRef.current = null;

    closeSheetTimeoutRef.current = setTimeout(() => {
      setSheetMode((prev) => {
        if (prev === 'marker' || prev === 'rubric') {
          setMarker(null);
        }
        return null;
      });
      setActiveTab('home');
      setSheetDragY(0);
      setIsSheetClosing(false);
      closeSheetTimeoutRef.current = null;
    }, 420);
  }, [isSheetClosing, sheetMode]);

  const openTab = useCallback((tab: Tab) => {
    if (tab === 'home') {
      // Нажатие на «Главная» закрывает простыню плавно
      closeSheet();
      return;
    }
    if (closeSheetTimeoutRef.current) {
      clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }
    setIsSheetClosing(false);
    setSheetDragY(0);
    setActiveTab(tab);
    if (tab === 'settings') {
      setSettingsView('main');
    }
    setSheetMode('tabs');
  }, [closeSheet]);

  const isSheetOpen = sheetMode !== null;
  const isSheetVisible = isSheetOpen || isSheetClosing;

  // Мягкое закрытие: даём анимации контейнера плавно
  // уехать вниз так же, как при нажатии на фон / крестик.
  const softCloseSheet = useCallback(() => {
    if (sheetMode === null) return;
    if (closeSheetTimeoutRef.current) {
      clearTimeout(closeSheetTimeoutRef.current);
      closeSheetTimeoutRef.current = null;
    }
    closeSheet();
  }, [closeSheet, sheetMode]);

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

    window.localStorage.setItem('theme-mode', initial);

    if (initial === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem('notifications-push', String(pushNotificationsEnabled));
    window.localStorage.setItem('notifications-email', String(emailNotificationsEnabled));
  }, [emailNotificationsEnabled, pushNotificationsEnabled]);

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
    map.doubleClickZoom.disable();

    map.on('dblclick', (e) => {
      handlePlaceMarker(e.lngLat.lat, e.lngLat.lng);
    });

    map.on('contextmenu', (e) => {
      e.preventDefault();
      handlePlaceMarker(e.lngLat.lat, e.lngLat.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      incidentMarkersRef.current.forEach((incidentMarker) => incidentMarker.remove());
      incidentMarkersRef.current = [];
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

    incidentMarkersRef.current.forEach((incidentMarker) => incidentMarker.remove());
    incidentMarkersRef.current = [];

    const getIncidentColor = (category: string) => {
      const normalizedCategory = category.toLowerCase();
      if (normalizedCategory.includes('жкх') || normalizedCategory.includes('благо')) return '#10b981';
      if (normalizedCategory.includes('дорог')) return '#f59e0b';
      if (normalizedCategory.includes('парков')) return '#0ea5e9';
      if (normalizedCategory.includes('торгов')) return '#f97316';
      if (normalizedCategory.includes('эколог')) return '#22c55e';
      return '#ef4444';
    };

    const getCategoryIcon = (category: string, tags?: string[]) => {
      const normalizedTags = (tags ?? []).map((tag) => tag.toLowerCase().replace(/^#/, ''));

      if (normalizedTags.some((tag) => tag.includes('жкх') || tag.includes('благо') || tag.includes('двор'))) {
        return '🏠';
      }
      if (normalizedTags.some((tag) => tag.includes('дорог') || tag.includes('яма') || tag.includes('тротуар'))) {
        return '🛣️';
      }
      if (normalizedTags.some((tag) => tag.includes('парков') || tag.includes('авто'))) {
        return '🚗';
      }
      if (normalizedTags.some((tag) => tag.includes('торгов') || tag.includes('магаз') || tag.includes('просроч'))) {
        return '🛒';
      }
      if (normalizedTags.some((tag) => tag.includes('эко') || tag.includes('мусор') || tag.includes('свалк'))) {
        return '🌿';
      }

      const normalizedCategory = category.toLowerCase();
      if (normalizedCategory.includes('жкх') || normalizedCategory.includes('благо')) return '🏠';
      if (normalizedCategory.includes('дорог')) return '🛣️';
      if (normalizedCategory.includes('парков')) return '🚗';
      if (normalizedCategory.includes('торгов')) return '🛒';
      if (normalizedCategory.includes('эколог')) return '🌿';
      return '📍';
    };

    const getStatusText = (status: string) => {
      const normalizedStatus = status.toLowerCase();
      if (normalizedStatus.includes('нов')) return 'Новая';
      if (normalizedStatus.includes('работ')) return 'В работе';
      if (normalizedStatus.includes('провер')) return 'Проверка';
      return status;
    };

    const markers = mapVisibleIncidents.map((incident) => {
      const pinColor = getIncidentColor(incident.category);
      const incidentTags = INCIDENT_DETAILS[incident.id]?.tags;
      const categoryIcon = getCategoryIcon(incident.category, incidentTags);
      const statusText = getStatusText(incident.status);
      const el = document.createElement('button');
      el.type = 'button';
      el.setAttribute('aria-label', incident.title);
      el.setAttribute('title', `${incident.title} • ${incident.category} • ${statusText}`);
      el.innerHTML = `
        <div style="position: relative; transform: translateY(-8px); display: inline-flex; flex-direction: column; align-items: center; gap: 3px;">
          <div style="width: 30px; height: 30px; border-radius: 9999px; border: 3px solid white; background: ${pinColor}; box-shadow: 0 4px 12px rgba(15,23,42,0.38); color: white; font-size: 15px; display: flex; align-items: center; justify-content: center; text-shadow: 0 1px 2px rgba(15,23,42,0.55);">
            ${categoryIcon}
          </div>
          <div style="width: 10px; height: 10px; border-radius: 9999px; background: white; border: 2px solid ${pinColor}; box-shadow: 0 2px 6px rgba(15,23,42,0.25);"></div>
          </div>
        </div>
      `;
      el.style.background = 'transparent';
      el.style.border = 'none';
      el.style.padding = '0';
      el.style.cursor = 'pointer';

      el.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        focusIncidentOnMap(incident);
      });

      return new maplibregl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([incident.lng, incident.lat])
        .addTo(map);
    });

    incidentMarkersRef.current = markers;

    return () => {
      markers.forEach((incidentMarker) => incidentMarker.remove());
      incidentMarkersRef.current = [];
    };
  }, [mapVisibleIncidents, focusIncidentOnMap]);

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

  const handleProfileWheel = useCallback((event: React.WheelEvent<HTMLDivElement>) => {
    const el = event.currentTarget;
    if (el.scrollTop <= 0 && event.deltaY < 0) {
      event.preventDefault();
      softCloseSheet();
    }
  }, [softCloseSheet]);

  const handleProfileTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    profileTouchStartYRef.current = event.touches[0]?.clientY ?? null;
    setSheetDragY(0);
    setIsSheetDragging(false);
  }, []);

  const handleProfileTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const startY = profileTouchStartYRef.current;
    const el = profileScrollRef.current;
    if (startY == null || !el) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = currentY - startY;

    if (el.scrollTop <= 0 && delta > 0) {
      event.preventDefault();
      setIsSheetDragging(true);
      setSheetDragY(delta);
    }
  }, []);

  const getSearchPanelSnapHeightPx = useCallback((snap: SearchPanelSnap) => {
    if (typeof window === 'undefined') return 160;
    if (snap === 'full') return window.innerHeight;
    if (snap === 'half') return window.innerHeight * 0.44;
    return 160;
  }, []);

  const getNearestSearchPanelSnap = useCallback((heightPx: number): SearchPanelSnap => {
    const points = [
      { snap: 'collapsed' as SearchPanelSnap, height: getSearchPanelSnapHeightPx('collapsed') },
      { snap: 'half' as SearchPanelSnap, height: getSearchPanelSnapHeightPx('half') },
      { snap: 'full' as SearchPanelSnap, height: getSearchPanelSnapHeightPx('full') },
    ];

    return points.reduce((best, point) => {
      const bestDiff = Math.abs(best.height - heightPx);
      const currentDiff = Math.abs(point.height - heightPx);
      return currentDiff < bestDiff ? point : best;
    }).snap;
  }, [getSearchPanelSnapHeightPx]);

  const handleSearchPanelTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (searchPanelSettleTimeoutRef.current) {
      clearTimeout(searchPanelSettleTimeoutRef.current);
      searchPanelSettleTimeoutRef.current = null;
    }

    searchPanelTouchStartYRef.current = event.touches[0]?.clientY ?? null;
    searchPanelStartSnapRef.current = searchPanelSnap;
    searchPanelTouchTargetRef.current = event.target as HTMLElement | null;
    searchPanelCanDragRef.current = false;
  }, [searchPanelSnap]);

  const handleSearchPanelTouchMove = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const startY = searchPanelTouchStartYRef.current;
    if (startY == null) return;

    const currentY = event.touches[0]?.clientY ?? startY;
    const delta = currentY - startY;
    const absDelta = Math.abs(delta);

    const touchTarget = searchPanelTouchTargetRef.current;
    const isFromHandle = Boolean(touchTarget?.closest('[data-search-drag-handle="true"]'));
    const scrollableParent = touchTarget?.closest('[data-search-scrollable="true"]') as HTMLElement | null;
    const canScrollUp = Boolean(scrollableParent && scrollableParent.scrollTop > 0);
    const canScrollDown = Boolean(
      scrollableParent &&
        scrollableParent.scrollTop + scrollableParent.clientHeight < scrollableParent.scrollHeight - 1
    );
    const isFullSnap = searchPanelStartSnapRef.current === 'full';
    const canStartDragFromContent =
      !scrollableParent ||
      (isFullSnap
        ? delta > 0 && !canScrollUp && absDelta > 16
        : (delta > 0 && !canScrollUp) || (delta < 0 && !canScrollDown));

    if (!isSearchPanelDragging) {
      const activationThreshold = isFromHandle ? 6 : isFullSnap ? 12 : 6;

      if (absDelta < activationThreshold) return;

      if (isFromHandle || canStartDragFromContent) {
        searchPanelCanDragRef.current = true;
        setIsSearchPanelDragging(true);
        setSearchPanelDragHeight(getSearchPanelSnapHeightPx(searchPanelStartSnapRef.current));
      } else {
        searchPanelCanDragRef.current = false;
        return;
      }
    }

    if (!searchPanelCanDragRef.current) return;

    event.preventDefault();

    const isActiveIncidentSwipeDownMode =
      selectedMapIncidentId !== null && searchPanelStartSnapRef.current === 'full' && delta > 0;

    if (isActiveIncidentSwipeDownMode) {
      return;
    }

    const minHeight = getSearchPanelSnapHeightPx('collapsed');
    const maxHeight = getSearchPanelSnapHeightPx('full');
    const baseHeight = getSearchPanelSnapHeightPx(searchPanelStartSnapRef.current);
    let nextHeight = baseHeight - delta;

    if (nextHeight < minHeight) {
      nextHeight = minHeight - (minHeight - nextHeight) * 0.35;
    } else if (nextHeight > maxHeight) {
      nextHeight = maxHeight + (nextHeight - maxHeight) * 0.35;
    }

    scheduleSearchPanelHeight(nextHeight);
  }, [getSearchPanelSnapHeightPx, isSearchPanelDragging, scheduleSearchPanelHeight, selectedMapIncidentId]);

  const handleSearchPanelTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const startY = searchPanelTouchStartYRef.current;
    if (startY == null) return;

    if (!searchPanelCanDragRef.current) {
      searchPanelTouchStartYRef.current = null;
      searchPanelTouchTargetRef.current = null;
      setSearchPanelDragHeight(null);
      setIsSearchPanelDragging(false);
      return;
    }

    const endY = event.changedTouches[0]?.clientY ?? startY;
    const delta = endY - startY;
    const minHeight = getSearchPanelSnapHeightPx('collapsed');
    const maxHeight = getSearchPanelSnapHeightPx('full');
    const currentHeight =
      searchPanelPendingHeightRef.current ??
      searchPanelDragHeight ??
      getSearchPanelSnapHeightPx(searchPanelStartSnapRef.current);
    const clampedHeight = Math.min(maxHeight, Math.max(minHeight, currentHeight));
    const threshold = 24;
    let targetSnap = searchPanelStartSnapRef.current;

    const isClosingOpenedIncidentBySwipeDown =
      selectedMapIncidentId !== null &&
      searchPanelStartSnapRef.current === 'full' &&
      delta > threshold;

    if (isClosingOpenedIncidentBySwipeDown) {
      setSelectedMapIncidentId(null);
      setShowSuggestions(false);
      targetSnap = 'collapsed';
    }

    if (!isClosingOpenedIncidentBySwipeDown && Math.abs(delta) < threshold) {
      targetSnap = searchPanelStartSnapRef.current;
    } else if (!isClosingOpenedIncidentBySwipeDown) {
      targetSnap = getNearestSearchPanelSnap(clampedHeight);
    }

    const targetHeight = getSearchPanelSnapHeightPx(targetSnap);
    searchPanelPendingHeightRef.current = null;
    setSearchPanelDragHeight(targetHeight);
    setSearchPanelSnap(targetSnap);

    searchPanelTouchStartYRef.current = null;
    searchPanelTouchTargetRef.current = null;
    searchPanelCanDragRef.current = false;
    setIsSearchPanelDragging(false);

    if (searchPanelSettleTimeoutRef.current) {
      clearTimeout(searchPanelSettleTimeoutRef.current);
      searchPanelSettleTimeoutRef.current = null;
    }

    searchPanelSettleTimeoutRef.current = setTimeout(() => {
      setSearchPanelDragHeight(null);
      searchPanelSettleTimeoutRef.current = null;
    }, 320);
  }, [getNearestSearchPanelSnap, getSearchPanelSnapHeightPx, searchPanelDragHeight, selectedMapIncidentId]);

  useEffect(() => {
    const shouldShowExpandedContent =
      searchPanelSnap !== 'collapsed' || isSearchPanelDragging || searchPanelDragHeight !== null;

    if (shouldShowExpandedContent) {
      if (searchPanelContentHideTimeoutRef.current) {
        clearTimeout(searchPanelContentHideTimeoutRef.current);
        searchPanelContentHideTimeoutRef.current = null;
      }

      if (renderExpandedSearchContent) {
        return;
      }

      if (searchPanelContentShowTimeoutRef.current) {
        clearTimeout(searchPanelContentShowTimeoutRef.current);
        searchPanelContentShowTimeoutRef.current = null;
      }

      const showDelayMs = isSearchPanelDragging ? 180 : 110;
      searchPanelContentShowTimeoutRef.current = setTimeout(() => {
        setRenderExpandedSearchContent(true);
        searchPanelContentShowTimeoutRef.current = null;
      }, showDelayMs);
      return;
    }

    if (searchPanelContentShowTimeoutRef.current) {
      clearTimeout(searchPanelContentShowTimeoutRef.current);
      searchPanelContentShowTimeoutRef.current = null;
    }

    if (searchPanelContentHideTimeoutRef.current) {
      clearTimeout(searchPanelContentHideTimeoutRef.current);
      searchPanelContentHideTimeoutRef.current = null;
    }

    searchPanelContentHideTimeoutRef.current = setTimeout(() => {
      setRenderExpandedSearchContent(false);
      searchPanelContentHideTimeoutRef.current = null;
    }, 260);
  }, [searchPanelDragHeight, searchPanelSnap, isSearchPanelDragging, renderExpandedSearchContent]);

  useEffect(() => {
    return () => {
      if (searchPanelDragRafRef.current !== null) {
        cancelAnimationFrame(searchPanelDragRafRef.current);
        searchPanelDragRafRef.current = null;
      }

      if (searchPanelContentHideTimeoutRef.current) {
        clearTimeout(searchPanelContentHideTimeoutRef.current);
        searchPanelContentHideTimeoutRef.current = null;
      }

      if (searchPanelContentShowTimeoutRef.current) {
        clearTimeout(searchPanelContentShowTimeoutRef.current);
        searchPanelContentShowTimeoutRef.current = null;
      }

      if (searchPanelSettleTimeoutRef.current) {
        clearTimeout(searchPanelSettleTimeoutRef.current);
        searchPanelSettleTimeoutRef.current = null;
      }
    };
  }, []);

  const isAuthFullscreen = sheetMode === 'tabs' && activeTab === 'auth';
  const collapsedSearchPanelHeight = getSearchPanelSnapHeightPx('collapsed');
  const currentSearchPanelHeight = searchPanelDragHeight ?? getSearchPanelSnapHeightPx(searchPanelSnap);
  const mapControlsLiftPx = Math.max(0, currentSearchPanelHeight - collapsedSearchPanelHeight);

  const handleProfileFabClick = useCallback(() => {
    if (isAuthenticated) {
      openTab('profile');
    } else {
      openTab('auth');
    }
  }, [isAuthenticated, openTab]);

  const handleSearchInputFocus = useCallback(() => {
    setSearchPanelSnap((prev) => (prev === 'collapsed' ? 'half' : prev));
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  }, [suggestions.length]);

  const handleSearchInputClear = useCallback(() => {
    setQuery('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  }, []);

  const handleAuthenticated = useCallback((payload: {
    id?: number;
    first_name?: string;
    last_name?: string;
    email?: string;
    avatar_url?: string | null;
  } | null) => {
    if (!payload) return;
    setIsAuthenticated(true);
    setUserProfile(payload);
    setActiveTab('home');
    setSheetMode(null);
  }, []);

  const noopCloseSheet = useCallback(() => {}, []);

  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-[1200] bg-background">
        <AuthPanel
          onAuthenticated={handleAuthenticated}
          closeSheet={noopCloseSheet}
        />
      </div>
    );
  }

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
      <MapProfileFab
        isDimmed={sheetMode === 'tabs' && isSheetOpen}
        avatarSrc={localAvatarPreviewUrl ?? resolveAvatarUrl(userProfile?.avatar_url) ?? null}
        onClick={handleProfileFabClick}
      />

      {/* Справа: zoom + фильтр доносов + геолокация */}
      <MapControls
        isHidden={searchPanelSnap === 'full'}
        mapControlsLiftPx={mapControlsLiftPx}
        isSearchPanelDragging={isSearchPanelDragging}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onLocateMe={handleLocateMe}
        locating={locating}
      />

      {/* Нижняя панель: только поиск */}
      <MapSearchPanel
        searchPanelDragHeight={searchPanelDragHeight}
        searchPanelSnap={searchPanelSnap}
        isSearchPanelDragging={isSearchPanelDragging}
        onTouchStart={handleSearchPanelTouchStart}
        onTouchMove={handleSearchPanelTouchMove}
        onTouchEnd={handleSearchPanelTouchEnd}
      >

          {/* Поиск */}
          <SearchInputBar
            inputRef={inputRef}
            query={query}
            loading={loading}
            onQueryChange={setQuery}
            onFocus={handleSearchInputFocus}
            onClear={handleSearchInputClear}
          />

          {!selectedMapIncident && (
            <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-muted-foreground">
              <span className="line-clamp-1">Поиск по адресам, рубрикам и точкам рядом</span>
              <span className="shrink-0">{nearbyIncidents.length} рядом</span>
            </div>
          )}

          {!selectedMapIncident && (
            <QuickSearchChips
              chips={QUICK_SEARCH_CHIPS}
              selectedChip={selectedMapTagFilter}
              onSelectChip={handleQuickSearch}
              getTagIcon={getTagIcon}
            />
          )}

          {!selectedMapIncident && showSuggestions && suggestions.length > 0 && (
            <SearchSuggestionsList
              suggestionsRef={suggestionsRef}
              suggestions={suggestions}
              maxHeightClassName={
                searchPanelSnap === 'full'
                  ? 'max-h-96'
                  : searchPanelSnap === 'half'
                    ? 'max-h-72'
                    : 'max-h-60'
              }
              onSelectSuggestion={handleSelectSuggestion}
            />
          )}

          <MapSearchExpandedContent
            renderExpandedSearchContent={renderExpandedSearchContent}
            expandedSearchContentRef={expandedSearchContentRef}
            searchPanelSnap={searchPanelSnap}
            isSearchPanelDragging={isSearchPanelDragging}
            selectedMapIncident={selectedMapIncident}
            selectedMapIncidentDetails={selectedMapIncidentDetails}
            selectedMapIncidentDistanceLabel={selectedMapIncidentDistanceLabel}
            getTagIcon={getTagIcon}
            openCreateReportFromSearch={openCreateReportFromSearch}
            filteredNearbyIncidents={filteredNearbyIncidents}
            focusIncidentOnMap={focusIncidentOnMap}
          />
      </MapSearchPanel>

      {/* Большая панель как в Яндекс.Картах */}
      <div
        className={cn(
          'absolute inset-0 z-[950] flex flex-col items-center justify-end pointer-events-none',
          isSheetVisible ? 'opacity-100' : 'opacity-0 transition-opacity duration-300'
        )}
      >
        {/* затемнение карты */}
        <div
          className={cn(
            'absolute inset-0 bg-black/40 transition-opacity duration-300',
            isSheetVisible ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          )}
          onClick={closeSheet}
        />

        {/* сама «простыня» */}
        <div
          className={cn(
            'relative w-full pointer-events-auto transform transition-transform duration-350 ease-[cubic-bezier(0.22,0.61,0.36,1)]',
            isSheetClosing && 'pointer-events-none',
            isAuthFullscreen ? 'max-w-none' : 'max-w-xl'
          )}
          style={{
            transform: isSheetOpen && !isSheetClosing
              ? `translateY(${sheetDragY}px)`
              : 'translateY(calc(100% + 32px))',
            transition: isSheetDragging ? 'none' : undefined,
            touchAction: 'pan-y',
          }}
          onTouchStart={isAuthFullscreen ? undefined : handleSheetTouchStart}
          onTouchMove={isAuthFullscreen ? undefined : handleSheetTouchMove}
          onTouchEnd={isAuthFullscreen ? undefined : handleSheetTouchEnd}
        >
          <div
            className={cn(
              isAuthFullscreen
                ? 'rounded-t-[28px] rounded-b-none h-screen px-0 pt-0 pb-[max(env(safe-area-inset-bottom),12px)] flex flex-col bg-transparent'
                : 'glass-dock rounded-t-[32px] rounded-b-none px-4 pt-3 pb-6 flex flex-col',
              sheetMode === 'marker'
                ? 'max-h-[65vh] overflow-hidden'
                : isAuthFullscreen
                  ? 'overflow-hidden'
                  : 'h-[calc(100vh-80px)] overflow-hidden'
            )}
          >
            {/* Drag handle */}
            {!isAuthFullscreen && (
              <div
                data-sheet-drag-handle="true"
                className="flex items-center justify-center py-5 -mx-4"
              >
                <div className="h-1 w-12 rounded-full bg-slate-300/80 dark:bg-white/15" />
              </div>
            )}

            {sheetMode === 'marker' && marker ? (
              <MapMarkerSheetContent marker={marker} onCopyCoords={copyCoords} onCreateReport={handleCreateReport} />
            ) : sheetMode === 'rubric' && marker ? (
              <MapRubricSheetContent
                marker={marker}
                selectedRubric={selectedRubric}
                rubricStep={rubricStep}
                rubrics={rubrics}
                setSelectedRubric={setSelectedRubric}
                setRubricStep={setRubricStep}
                closeSheet={closeSheet}
                reportTitle={reportTitle}
                setReportTitle={setReportTitle}
                reportText={reportText}
                setReportText={setReportText}
                reportPhotos={reportPhotos}
                reportPhotoPreviews={reportPhotoPreviews}
                handleReportPhotosChange={handleReportPhotosChange}
                handlePublishReport={handlePublishReport}
                handleSaveDraft={handleSaveDraft}
                handleSaveToFiles={handleSaveToFiles}
                handleSendEmail={handleSendEmail}
                handlePrint={handlePrint}
              />
            ) : (
              <MapTabsSheetContent
                isAuthFullscreen={isAuthFullscreen}
                activeTab={activeTab}
                settingsView={settingsView}
                closeSheet={closeSheet}
                openTab={openTab}
                setSettingsView={setSettingsView}
                profileScrollRef={profileScrollRef}
                handleProfileWheel={handleProfileWheel}
                handleProfileTouchStart={handleProfileTouchStart}
                handleProfileTouchMove={handleProfileTouchMove}
                profileAvatarInputRef={profileAvatarInputRef}
                userProfile={userProfile}
                localAvatarPreviewUrl={localAvatarPreviewUrl}
                isAvatarUploading={isAvatarUploading}
                handleProfileAvatarFileChange={handleProfileAvatarFileChange}
                userTrustProgress={userTrustProgress}
                userActiveIncidents={userActiveIncidents}
                profileStatusFilters={profileStatusFilters}
                selectedProfileStatusFilter={selectedProfileStatusFilter}
                setSelectedProfileStatusFilter={setSelectedProfileStatusFilter}
                profileCategoryFilters={profileCategoryFilters}
                selectedProfileCategoryFilter={selectedProfileCategoryFilter}
                setSelectedProfileCategoryFilter={setSelectedProfileCategoryFilter}
                filteredUserActiveIncidents={filteredUserActiveIncidents}
                focusIncidentOnMap={focusIncidentOnMap}
                setSheetMode={setSheetMode}
                getTagIcon={getTagIcon}
                getProfileIncidentCategoryTagClass={getProfileIncidentCategoryTagClass}
                getProfileIncidentStatusTagClass={getProfileIncidentStatusTagClass}
                getStatusIcon={getStatusIcon}
                incidentDetails={INCIDENT_DETAILS}
                nearbyIncidentsById={nearbyIncidentsById}
                setIsAuthenticated={setIsAuthenticated}
                setUserProfile={setUserProfile}
                isAuthenticated={isAuthenticated}
                pushNotificationsEnabled={pushNotificationsEnabled}
                setPushNotificationsEnabled={setPushNotificationsEnabled}
                emailNotificationsEnabled={emailNotificationsEnabled}
                setEmailNotificationsEnabled={setEmailNotificationsEnabled}
                ProfileTab={ProfileTab}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
