import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Car, ShoppingBag, ArrowRight } from 'lucide-react';

interface Rubric {
  id: number;
  title: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  path: string;
}

interface RubricsScreenProps {
  onRubricSelect?: (rubric: Rubric) => void;
}

const RubricsScreen: React.FC<RubricsScreenProps> = ({ onRubricSelect }) => {
  const navigate = useNavigate();

  const rubrics: Rubric[] = [
    {
      id: 1,
      title: 'Нарушение правил парковки',
      icon: <Car className="h-8 w-8" />,
      color: 'from-blue-500 to-blue-600',
      description: 'Неправильная парковка, место для инвалидов и другие нарушения',
      path: '/create/parking'
    },
    {
      id: 2,
      title: 'Просроченные товары',
      icon: <ShoppingBag className="h-8 w-8" />,
      color: 'from-purple-500 to-pink-500',
      description: 'Продажа просроченных продуктов в магазинах',
      path: '/create/products'
    }
  ];

  const handleRubricClick = (rubric: Rubric) => {
    if (onRubricSelect) {
      onRubricSelect(rubric);
    } else {
      navigate(rubric.path);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Заголовок в твоем стиле */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-slate-50 mb-2">
          Выберите тип инцидента
        </h1>
        <p className="text-sm text-gray-500 dark:text-slate-400">
          Выберите тип проблемы, и мы поможем составить обращение
        </p>
      </div>

      {/* Список рубрик */}
      <div className="space-y-4">
        {rubrics.map((rubric) => (
          <button
            key={rubric.id}
            onClick={() => handleRubricClick(rubric)}
            className="w-full group relative bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden"
          >
            {/* Градиентная полоска слева */}
            <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${rubric.color}`} />
            
            <div className="flex items-center p-5 pl-7">
              {/* Иконка с фоном */}
              <div className={`flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br ${rubric.color} bg-opacity-10 flex items-center justify-center text-white`}>
                <div className="text-white">{rubric.icon}</div>
              </div>

              {/* Текст */}
              <div className="flex-1 text-left ml-4">
                <h3 className="text-base font-medium text-gray-900 dark:text-slate-50 group-hover:text-blue-600 dark:group-hover:text-sky-400 transition-colors duration-300">
                  {rubric.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 line-clamp-2">
                  {rubric.description}
                </p>
              </div>

              {/* Стрелка */}
              <div className="flex-shrink-0 ml-2 text-gray-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-sky-400 group-hover:translate-x-1 transition-all duration-300">
                <ArrowRight className="h-5 w-5" />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default RubricsScreen;