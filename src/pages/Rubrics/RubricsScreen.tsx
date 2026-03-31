import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { api, type Category } from '@/lib/api';

type Rubric = {
  id: number;
  title: string;
  color: string;
  description: string;
  path: string;
  emoji: string;
};

function getCategoryColorClass(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('парков')) return 'from-blue-500 to-blue-600';
  if (normalized.includes('торгов') || normalized.includes('просроч')) return 'from-purple-500 to-pink-500';
  if (normalized.includes('дорог') || normalized.includes('яма')) return 'from-amber-500 to-orange-500';
  if (normalized.includes('жкх') || normalized.includes('благо') || normalized.includes('мусор')) return 'from-emerald-500 to-teal-500';
  if (normalized.includes('эко')) return 'from-lime-500 to-green-600';
  return 'from-sky-500 to-indigo-600';
}

function getCategoryEmoji(title: string) {
  const normalized = title.toLowerCase();
  if (normalized.includes('парков')) return '🚗';
  if (normalized.includes('торгов') || normalized.includes('просроч')) return '🛒';
  if (normalized.includes('дорог') || normalized.includes('яма') || normalized.includes('тротуар')) return '🛣️';
  if (normalized.includes('жкх') || normalized.includes('благо') || normalized.includes('мусор')) return '🏠';
  if (normalized.includes('эко')) return '🌿';
  return '📍';
}

export default function RubricsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address') ?? '';
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void api
      .listCategories()
      .then(setCategories)
      .catch((err) => setError(err instanceof Error ? err.message : 'Не удалось загрузить категории.'));
  }, []);

  const rubrics: Rubric[] = useMemo(
    () =>
      categories.map((category) => ({
        id: category.id,
        title: category.title,
        color: getCategoryColorClass(category.title),
        description: `Сообщить о проблеме по категории «${category.title}».`,
        path: `/create/category/${category.id}`,
        emoji: getCategoryEmoji(category.title),
      })),
    [categories]
  );

  const handleRubricClick = (rubric: Rubric) => {
    const params = new URLSearchParams({ lat: lat ?? '', lng: lng ?? '', address, categoryId: String(rubric.id) });
    navigate(`${rubric.path}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-8">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-[#94a3b8] hover:text-white mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Назад на карту</span>
        </button>
        <h1 className="text-2xl font-semibold text-white mb-2">Выберите тип инцидента</h1>
        <p className="text-sm text-[#94a3b8] mb-8">Выберите реальную категорию из backend и создайте обращение</p>

        {error && <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>}

        <div className="space-y-4">
          {rubrics.map((rubric) => (
            <button
              key={rubric.id}
              onClick={() => handleRubricClick(rubric)}
              className="w-full group relative bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${rubric.color}`} />
              <div className="flex items-center p-5 pl-7">
                <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${rubric.color} flex items-center justify-center text-white text-2xl opacity-90`}>
                  <span aria-hidden>{rubric.emoji}</span>
                </div>
                <div className="flex-1 text-left ml-4">
                  <h3 className="text-base font-medium text-white group-hover:text-sky-400 transition-colors">{rubric.title}</h3>
                  <p className="text-sm text-[#94a3b8] mt-0.5 line-clamp-2">{rubric.description}</p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#64748b] group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}

          {rubrics.length === 0 && !error && (
            <div className="rounded-2xl border border-white/10 bg-[#1a1a1a] p-4 text-sm text-[#94a3b8]">Категории пока не загружены.</div>
          )}
        </div>
      </div>
    </div>
  );
}
