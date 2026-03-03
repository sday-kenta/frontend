import { useNavigate, useSearchParams } from 'react-router-dom';
import { Car, ShoppingBag, ArrowRight, ArrowLeft } from 'lucide-react';

interface Rubric {
  id: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  path: string;
}

export default function RubricsScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const lat = searchParams.get('lat');
  const lng = searchParams.get('lng');
  const address = searchParams.get('address') ?? '';

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

  const handleRubricClick = (rubric: Rubric) => {
    const params = new URLSearchParams({ lat: lat ?? '', lng: lng ?? '', address });
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
        <h1 className="text-2xl font-semibold text-white mb-2">
          Выберите тип инцидента
        </h1>
        <p className="text-sm text-[#94a3b8] mb-8">
          Выберите тип проблемы, и мы поможем составить обращение
        </p>
        <div className="space-y-4">
          {rubrics.map((rubric) => (
            <button
              key={rubric.id}
              onClick={() => handleRubricClick(rubric)}
              className="w-full group relative bg-[#1a1a1a] rounded-2xl border border-white/10 hover:border-white/20 transition-all overflow-hidden"
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
                  <h3 className="text-base font-medium text-white group-hover:text-sky-400 transition-colors">
                    {rubric.title}
                  </h3>
                  <p className="text-sm text-[#94a3b8] mt-0.5 line-clamp-2">
                    {rubric.description}
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-[#64748b] group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
