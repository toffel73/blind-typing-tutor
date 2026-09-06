"use client";

import { Award, TrendingUp } from "lucide-react";

export interface WeeklyTrainingStat {
  weekStart: string;
  averageWpm: number;
  correctWords: number;
  attemptedWords: number;
  correctWordRate: number;
}

interface ProgressChartsProps {
  weeks: WeeklyTrainingStat[];
}

function formatWeek(date: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit" }).format(
    new Date(`${date}T12:00:00`)
  );
}

function LineChart({
  values,
  labels,
  color,
  suffix,
  emptyLabel,
}: {
  values: number[];
  labels: string[];
  color: string;
  suffix: string;
  emptyLabel: string;
}) {
  if (values.length === 0 || values.every((value) => value === 0)) {
    return <div className="h-48 grid place-items-center text-sm text-gray-500">{emptyLabel}</div>;
  }

  const width = 640;
  const height = 210;
  const padding = { top: 22, right: 20, bottom: 38, left: 42 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maximum = Math.max(...values, 1);
  const points = values.map((value, index) => ({
    x: padding.left + (values.length === 1 ? chartWidth / 2 : (index / (values.length - 1)) * chartWidth),
    y: padding.top + chartHeight - (value / maximum) * chartHeight,
  }));
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `${padding.left},${padding.top + chartHeight} ${line} ${padding.left + chartWidth},${padding.top + chartHeight}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-52" role="img" aria-label={`${values.join(", ")} ${suffix}`}>
      {[0, 0.5, 1].map((step) => {
        const y = padding.top + chartHeight - step * chartHeight;
        return (
          <g key={step}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-gray-400 text-[10px]">{Math.round(maximum * step)}</text>
          </g>
        );
      })}
      <polygon points={area} fill={color} opacity="0.12" />
      <polyline points={line} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point, index) => (
        <g key={`${labels[index]}-${index}`}>
          <circle cx={point.x} cy={point.y} r="5" fill="white" stroke={color} strokeWidth="3">
            <title>{`${labels[index]}: ${values[index]} ${suffix}`}</title>
          </circle>
          <text x={point.x} y={height - 12} textAnchor="middle" className="fill-gray-500 text-[10px]">{labels[index]}</text>
        </g>
      ))}
    </svg>
  );
}

export function ProgressCharts({ weeks }: ProgressChartsProps) {
  const labels = weeks.map((week) => formatWeek(week.weekStart));
  const latest = weeks.at(-1);
  const previous = weeks.at(-2);
  const wpmChange = latest && previous ? latest.averageWpm - previous.averageWpm : null;
  const bestWpm = Math.max(0, ...weeks.map((week) => week.averageWpm));

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-violet-50 dark:bg-violet-950/30 p-4 flex gap-3">
          <TrendingUp className="text-violet-600 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Dein Tempo entwickelt sich</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {wpmChange == null ? "Nach zwei Lernwochen erscheint hier dein Trend." : wpmChange >= 0 ? `Diese Woche ${wpmChange} WPM schneller.` : "Schwankungen sind normal – bleib regelmäßig dran."}
            </p>
          </div>
        </div>
        <div className="rounded-2xl bg-amber-50 dark:bg-amber-950/30 p-4 flex gap-3">
          <Award className="text-amber-600 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Persönliche Bestleistung</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{bestWpm > 0 ? `${bestWpm} Wörter pro Minute` : "Dein erster Bestwert wartet auf dich."}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Wörter pro Minute</h4>
          <p className="text-xs text-gray-500">Wöchentliche Durchschnittsgeschwindigkeit</p>
          <LineChart values={weeks.map((week) => week.averageWpm)} labels={labels} color="#6d28d9" suffix="WPM" emptyLabel="Trainiere weiter, um deine erste Tempokurve zu sehen." />
        </section>
        <section className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white">Richtig geschriebene Wörter</h4>
          <p className="text-xs text-gray-500">Erfolgsquote pro Lernwoche</p>
          <LineChart values={weeks.map((week) => week.correctWordRate)} labels={labels} color="#16a34a" suffix="% richtig" emptyLabel="Nach den ersten vollständig getippten Wörtern erscheint deine Genauigkeitskurve." />
          {latest && latest.attemptedWords > 0 && (
            <p className="text-center text-xs text-gray-500">Letzte Woche: {latest.correctWords} von {latest.attemptedWords} Wörtern richtig</p>
          )}
        </section>
      </div>
    </div>
  );
}
