import { memo, type ChangeEvent, type ReactNode } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  CircleDot,
  FileDown,
  ImagePlus,
  Mail,
  Printer,
  Save,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  reportSubmitting?: boolean;
  reportFeedback?: string | null;
};

const stepTitles: Record<RubricStep, string> = {
  select: 'Выбор рубрики',
  create: 'Детали обращения',
  preview: 'Проверка перед отправкой',
};

const stepOrder: RubricStep[] = ['select', 'create', 'preview'];

function SurfaceCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.92),rgba(2,6,23,0.98))] p-4 shadow-[0_18px_38px_rgba(0,0,0,0.28)] backdrop-blur-xl', className)}>
      {children}
    </div>
  );
}

function MetadataPill({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] text-white/65', className)}>
      {children}
    </span>
  );
}

function StepRail({ rubricStep }: { rubricStep: RubricStep }) {
  const activeIndex = stepOrder.indexOf(rubricStep);

  return (
    <div className="grid grid-cols-3 gap-2">
      {stepOrder.map((step, index) => {
        const isActive = step === rubricStep;
        const isDone = index < activeIndex;
        return (
          <div
            key={step}
            className={cn(
              'rounded-2xl border px-3 py-2 text-left transition',
              isActive
                ? 'border-sky-400/30 bg-sky-500/12 text-white shadow-[0_0_0_1px_rgba(56,189,248,0.14)]'
                : isDone
                  ? 'border-emerald-400/20 bg-emerald-500/10 text-white/85'
                  : 'border-white/8 bg-white/[0.03] text-white/45'
            )}
          >
            <div className="mb-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em]">
              {isDone ? <Check className="h-3 w-3" /> : <CircleDot className="h-3 w-3" />}
              <span>Шаг {index + 1}</span>
            </div>
            <div className="text-xs font-medium leading-tight">
              {step === 'select' && 'Рубрика'}
              {step === 'create' && 'Описание'}
              {step === 'preview' && 'Отправка'}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export const MapRubricSheetContent = memo(function MapRubricSheetContent({
  marker,
  selectedRubric,
  rubricStep,
  rubrics,
  setSelectedRubric,
  setRubricStep,
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
  reportSubmitting = false,
  reportFeedback = null,
}: MapRubricSheetContentProps) {
  const canContinueToPreview = reportTitle.trim().length > 0 && reportText.trim().length > 0;
  const canGoBack = rubricStep !== 'select';

  const goBack = () => {
    if (rubricStep === 'preview') {
      setRubricStep('create');
      return;
    }

    if (rubricStep === 'create') {
      setSelectedRubric(null);
      setRubricStep('select');
    }
  };

  return (
    <div className="space-y-3 px-1 pb-24 text-white" data-search-scrollable="true">
      <SurfaceCard className="p-0">
        <div className="relative overflow-hidden rounded-[26px] bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.16),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.98))] p-4">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="mb-2 text-[11px] uppercase tracking-[0.22em] text-sky-200/70">Создание обращения</p>
              <h3 className="text-sm font-semibold text-white">{stepTitles[rubricStep]}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/55">
                {marker.address ?? 'Адрес уточняется'}
              </p>
            </div>
            {selectedRubric ? (
              <span className={cn('inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br text-white shadow-lg', selectedRubric.color)}>
                {selectedRubric.icon}
              </span>
            ) : (
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-[20px] border border-white/10 bg-white/[0.05] text-lg text-white/70">
                📍
              </span>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <MetadataPill>{marker.lat.toFixed(6)}</MetadataPill>
            <MetadataPill>{marker.lng.toFixed(6)}</MetadataPill>
            {selectedRubric ? <MetadataPill>{selectedRubric.title}</MetadataPill> : <MetadataPill>Выбери рубрику</MetadataPill>}
          </div>

          {reportFeedback && (
            <div className="mt-4 rounded-2xl border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
              {reportFeedback}
            </div>
          )}
        </div>
      </SurfaceCard>

      <StepRail rubricStep={rubricStep} />

      {canGoBack ? (
        <button
          type="button"
          onClick={goBack}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-white/75 transition hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Назад к предыдущему шагу
        </button>
      ) : null}

      {!selectedRubric ? (
        <div className="space-y-3">
          {rubrics.map((rubric) => (
            <button
              key={rubric.id}
              type="button"
              onClick={() => {
                setSelectedRubric(rubric);
                setRubricStep('create');
              }}
              className="group w-full text-left"
            >
              <SurfaceCard className="relative overflow-hidden transition group-hover:border-sky-400/25 group-hover:bg-white/[0.08]">
                <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
                <div className="relative flex items-center gap-4">
                  <div className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br text-white shadow-lg', rubric.color)}>
                    {rubric.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-white/55">
                        Рубрика
                      </span>
                    </div>
                    <h3 className="truncate text-sm font-semibold text-white transition group-hover:text-sky-200">{rubric.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/45">{rubric.description}</p>
                  </div>
                </div>
              </SurfaceCard>
            </button>
          ))}
        </div>
      ) : rubricStep === 'create' ? (
        <div className="space-y-3">
          <SurfaceCard>
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">Шаг 2</p>
                <h3 className="mt-1 text-base font-semibold text-white">Опиши проблему в том же потоке</h3>
              </div>
              <span className={cn('inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg', selectedRubric.color)}>
                {selectedRubric.icon}
              </span>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="mb-2 block text-xs font-medium text-white/65">Тема</span>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="Например: незаконная парковка у подъезда"
                  className="w-full rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/28 outline-none transition focus:border-sky-400/30 focus:bg-white/[0.06]"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-medium text-white/65">Описание</span>
                <textarea
                  value={reportText}
                  onChange={(e) => setReportText(e.target.value)}
                  rows={5}
                  placeholder="Что произошло, когда это заметили, почему это важно и что должен увидеть модератор"
                  className="w-full resize-none rounded-[22px] border border-white/10 bg-white/[0.04] px-4 py-3 text-base text-white placeholder:text-white/28 outline-none transition focus:border-sky-400/30 focus:bg-white/[0.06]"
                  style={{ WebkitUserSelect: 'text' }}
                />
              </label>
            </div>
          </SurfaceCard>

          <SurfaceCard>
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-sky-200">
                <Camera className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Фотодоказательства</h4>
                <p className="text-xs text-white/45">Фото прикрепятся к инциденту и уйдут в backend после публикации.</p>
              </div>
            </div>

            <label className="flex cursor-pointer flex-col items-center justify-center rounded-[22px] border border-dashed border-white/12 bg-white/[0.03] px-4 py-5 text-center transition hover:border-sky-400/30 hover:bg-white/[0.05]">
              <span className="mb-2 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-500/14 text-sky-200">
                <ImagePlus className="h-4 w-4" />
              </span>
              <span className="text-sm font-medium text-white">Добавить фото</span>
              <span className="mt-1 text-xs text-white/45">JPG, PNG и другие изображения, которые поддерживает устройство</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleReportPhotosChange}
              />
            </label>

            {reportPhotoPreviews.length > 0 && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  {reportPhotoPreviews.slice(0, 3).map((preview, index) => (
                    <img
                      key={`${preview}-${index}`}
                      src={preview}
                      alt={`Фото ${index + 1}`}
                      className="aspect-square w-full rounded-[20px] border border-white/10 object-cover"
                    />
                  ))}
                </div>
                <p className="text-xs text-white/45">Выбрано файлов: {reportPhotos.length}</p>
              </div>
            )}
          </SurfaceCard>

          <button
            type="button"
            onClick={() => setRubricStep('preview')}
            disabled={!canContinueToPreview || reportSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[linear-gradient(135deg,#38bdf8,#2563eb)] px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(37,99,235,0.35)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Проверить перед отправкой
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <SurfaceCard>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-white/40">Шаг 3</p>
                <h3 className="mt-1 text-base font-semibold text-white">{reportTitle || 'Без темы'}</h3>
              </div>
              <MetadataPill className="border-emerald-400/20 bg-emerald-500/10 text-emerald-200">Готово к отправке</MetadataPill>
            </div>

            <div className="space-y-3 text-sm">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/40">Категория и точка</p>
                <p className="font-medium text-white">{selectedRubric.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/50">{marker.address ?? 'Адрес уточняется'}</p>
                <p className="mt-2 text-xs text-white/35">{marker.lat.toFixed(6)}, {marker.lng.toFixed(6)}</p>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/40">Описание</p>
                <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-white/80">
                  {reportText || 'Текст не указан'}
                </div>
              </div>

              <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/40">Вложения</p>
                {reportPhotoPreviews.length === 0 ? (
                  <p className="text-xs text-white/45">Фото не добавлены</p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {reportPhotoPreviews.slice(0, 3).map((preview, index) => (
                        <img
                          key={`${preview}-${index}`}
                          src={preview}
                          alt={`Превью ${index + 1}`}
                          className="aspect-square w-full rounded-[18px] border border-white/10 object-cover"
                        />
                      ))}
                    </div>
                    <p className="text-xs text-white/45">Всего фото: {reportPhotoPreviews.length}</p>
                  </div>
                )}
              </div>
            </div>
          </SurfaceCard>

          <button
            type="button"
            onClick={handlePublishReport}
            disabled={!canContinueToPreview || reportSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-[24px] bg-[linear-gradient(135deg,#22c55e,#2563eb)] px-4 py-4 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(34,197,94,0.28)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {reportSubmitting ? 'Отправляем...' : 'Опубликовать обращение'}
          </button>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={reportSubmitting}
              className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-3 text-xs font-medium text-white/85 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <Save className="h-3.5 w-3.5" />
              В черновики
            </button>
            <button
              type="button"
              onClick={handleSaveToFiles}
              disabled={reportSubmitting}
              className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-3 text-xs font-medium text-white/85 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <FileDown className="h-3.5 w-3.5" />
              В файлы
            </button>
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={reportSubmitting}
              className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-3 text-xs font-medium text-white/85 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <Mail className="h-3.5 w-3.5" />
              На e-mail
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={reportSubmitting}
              className="flex items-center justify-center gap-2 rounded-[22px] border border-white/10 bg-white/[0.05] px-3 py-3 text-xs font-medium text-white/85 transition hover:bg-white/[0.08] disabled:opacity-50"
            >
              <Printer className="h-3.5 w-3.5" />
              Печать
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
