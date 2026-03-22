import { memo, type ChangeEvent, type ReactNode } from 'react';
import { ChevronRight, X } from 'lucide-react';

type MarkerPoint = {
  lat: number;
  lng: number;
  address?: string;
};

type RubricItem = {
  id: number;
  title: string;
  icon: ReactNode;
  color: string;
  description: string;
  path: string;
};

type RubricStep = 'select' | 'create' | 'preview';

type MapRubricSheetContentProps = {
  marker: MarkerPoint;
  selectedRubric: RubricItem | null;
  rubricStep: RubricStep;
  rubrics: RubricItem[];
  setSelectedRubric: (rubric: RubricItem | null) => void;
  setRubricStep: (step: RubricStep) => void;
  closeSheet: () => void;
  reportTitle: string;
  setReportTitle: (value: string) => void;
  reportText: string;
  setReportText: (value: string) => void;
  reportPhotos: File[];
  reportPhotoPreviews: string[];
  handleReportPhotosChange: (event: ChangeEvent<HTMLInputElement>) => void;
  handlePublishReport: () => void;
  handleSaveDraft: () => void;
  handleSaveToFiles: () => void;
  handleSendEmail: () => void;
  handlePrint: () => void;
};

export const MapRubricSheetContent = memo(function MapRubricSheetContent({
  marker,
  selectedRubric,
  rubricStep,
  rubrics,
  setSelectedRubric,
  setRubricStep,
  closeSheet,
  reportTitle,
  setReportTitle,
  reportText,
  setReportText,
  reportPhotos,
  reportPhotoPreviews,
  handleReportPhotosChange,
  handlePublishReport,
  handleSaveDraft,
  handleSaveToFiles,
  handleSendEmail,
  handlePrint,
}: MapRubricSheetContentProps) {
  return (
    <div className="flex-1 overflow-y-auto overscroll-contain pb-2 sheet-swap-enter" data-sheet-scrollable="true">
      {!selectedRubric ? (
        <>
          <div className="mb-1 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">Выбор рубрики</h2>
            <button
              type="button"
              onClick={closeSheet}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-200 text-slate-600 shadow-sm border border-slate-300 hover:bg-slate-300 hover:text-slate-800 dark:bg-black/40 dark:text-[#9ca3af] dark:border-transparent dark:hover:bg-black/60"
              aria-label="Закрыть"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">Выберите тип инцидента</p>
          <p className="text-xs text-slate-600 dark:text-[#94a3b8] mb-4">
            По адресу {marker.address ?? 'адрес уточняется'}: {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
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
                className="w-full group relative bg-white rounded-[12px] border border-slate-200 hover:border-slate-300 dark:bg-[#020617] dark:border-white/10 dark:hover:border-white/20 transition-all overflow-hidden text-left"
              >
                <div className={`absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b ${rubric.color}`} />
                <div className="flex items-center p-5 pl-7">
                  <div
                    className={`flex-shrink-0 w-14 h-14 rounded-[12px] bg-gradient-to-br ${rubric.color} flex items-center justify-center text-white opacity-90`}
                  >
                    {rubric.icon}
                  </div>
                  <div className="flex-1 text-left ml-4">
                    <h3 className="text-sm font-medium text-slate-900 dark:text-white group-hover:text-sky-500 dark:group-hover:text-sky-400 transition-colors">
                      {rubric.title}
                    </h3>
                    <p className="text-xs text-[#94a3b8] mt-0.5 line-clamp-2">{rubric.description}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-[#64748b] group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            ))}
          </div>
        </>
      ) : rubricStep === 'create' ? (
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
            <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">Создание обращения</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{selectedRubric.title}</h2>
            <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-1">
              {marker.address ?? 'Адрес уточняется'} — {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Тема обращения</label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="Кратко опишите проблему"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none dark:bg-[#020617] dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Текст обращения</label>
              <textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={4}
                placeholder="Опишите, что произошло, когда и при каких условиях"
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none resize-none dark:bg-[#020617] dark:border-white/10 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-200">Фото</label>
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
                <p className="text-[11px] text-slate-500 dark:text-[#9ca3af]">Выбрано файлов: {reportPhotos.length}</p>
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
      ) : (
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
            <p className="text-[11px] uppercase tracking-wide text-[#64748b] mb-1">Предпросмотр</p>
            <h2 className="text-base font-semibold text-slate-900 dark:text-white">{reportTitle || 'Без темы'}</h2>
            <p className="text-xs text-slate-600 dark:text-[#94a3b8] mt-1">
              {selectedRubric.title} • {marker.address ?? 'Адрес уточняется'} • {marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-900 dark:border-white/10 dark:bg-[#020617] dark:text-white">
            <div className="whitespace-pre-wrap break-words">{reportText || 'Текст не указан'}</div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-700 dark:text-slate-200">Фото</p>
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
                <p className="text-[11px] text-slate-500 dark:text-[#9ca3af]">Всего фото: {reportPhotoPreviews.length}</p>
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
            <p className="text-[11px] uppercase tracking-wide text-[#64748b]">Дополнительные действия</p>
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
      )}
    </div>
  );
});
