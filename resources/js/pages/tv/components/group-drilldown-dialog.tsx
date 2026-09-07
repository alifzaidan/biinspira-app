import { ChartContainer, ChartTooltip, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight, BarChart3, Layers, Layers2, Sparkles, TrendingUp } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import type { DrilldownData, DrilldownMetric } from '../types';
import { formatCompactCurrency, formatCurrency } from '../utils';

type GroupDrilldownDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    error: string | null;
    data: DrilldownData | null;
    activeMetric: DrilldownMetric;
    onMetricChange: (metric: DrilldownMetric) => void;
};

// Platform color mapping for distinct visual presentation
const PLATFORM_COLORS: Record<string, { bg: string; border: string }> = {
    biinspira: { bg: '#6366f1', border: '#4f46e5' }, // Indigo
    smartcounting: { bg: '#0284c7', border: '#0369a1' }, // Sky
    smartcountingacademy: { bg: '#0d9488', border: '#0f766e' }, // Teal
    kompeten: { bg: '#16a34a', border: '#15803d' }, // Green
    sekolahpajak: { bg: '#eab308', border: '#ca8a04' }, // Yellow/Amber
    talenta: { bg: '#f97316', border: '#c2410c' }, // Orange
    skillgrow: { bg: '#ec4899', border: '#be185d' }, // Pink
    aksademy: { bg: '#8b5cf6', border: '#6d28d9' }, // Purple
};

const DEFAULT_COLOR = { bg: '#64748b', border: '#475569' };

export default function GroupDrilldownDialog({ open, onOpenChange, loading, error, data, activeMetric, onMetricChange }: GroupDrilldownDialogProps) {
    const [comparisonMode, setComparisonMode] = useState<'accumulated' | 'stacked'>('accumulated');

    const availablePlatforms = useMemo(() => {
        if (!data || !data.platforms) {
            return [];
        }
        return data.platforms;
    }, [data]);

    const chartConfig = useMemo(() => {
        const config: ChartConfig = {
            value: {
                label: 'Total Omset Group',
                color: '#3b82f6',
            },
        };

        availablePlatforms.forEach((p) => {
            config[p.key] = {
                label: p.label,
                color: (PLATFORM_COLORS[p.key] ?? DEFAULT_COLOR).bg,
            };
        });

        return config;
    }, [availablePlatforms]);

    const chartData = useMemo(() => {
        if (!data) {
            return [];
        }

        return data.points.map((point) => {
            const item: Record<string, any> = {
                period: point.label,
                value: point.value,
                change_percentage: point.change_percentage ?? 0,
                change_direction: point.change_direction ?? 'flat',
                avg_change_percentage: point.avg_change_percentage ?? 0,
                avg_change_direction: point.avg_change_direction ?? 'flat',
                avg_value: point.avg_value ?? 0,
            };

            if (point.platforms) {
                Object.entries(point.platforms).forEach(([pKey, pVal]) => {
                    item[pKey] = pVal;
                });
            }

            return item;
        });
    }, [data]);

    const chartWidth = useMemo(() => {
        const minWidth = 640;
        const maxWidth = 1600;
        const calculatedWidth = chartData.length * 52;

        return Math.min(maxWidth, Math.max(minWidth, calculatedWidth));
    }, [chartData]);

    const monthlyMinChartWidth = useMemo(() => {
        const minWidth = 640;
        const calculatedWidth = chartData.length * 52;

        return Math.max(minWidth, calculatedWidth);
    }, [chartData]);

    const isMonthlyMetric = activeMetric === 'month';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] overflow-hidden sm:max-w-5xl">
                <DialogHeader className="border-b border-slate-100 pb-2">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-indigo-500 to-sky-600 text-white shadow-md">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-bold text-slate-900">Grafik Omset Group Biinspira</DialogTitle>
                                <DialogDescription className="text-xs text-slate-500">
                                    {data ? data.subtitle : 'Memuat data rincian akumulasi group...'}
                                </DialogDescription>
                            </div>
                        </div>

                        {data && (
                            <div className="flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs text-indigo-900">
                                <span className="font-semibold text-slate-600">Total Periode:</span>
                                <span className="text-base font-black text-indigo-700">{formatCurrency(data.total)}</span>
                            </div>
                        )}
                    </div>
                </DialogHeader>

                {/* Toolbar Switches */}
                <div className="my-2 flex flex-wrap items-center justify-between gap-2.5 rounded-xl border border-slate-200 bg-slate-50/80 p-2 text-xs">
                    {/* Metric Switch: Per Bulan vs Per Hari */}
                    <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase">Tampilan Granular:</span>
                        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
                            <button
                                type="button"
                                onClick={() => onMetricChange('month')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                                    activeMetric === 'month' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <BarChart3 className="h-3.5 w-3.5" />
                                Per Bulan
                            </button>
                            <button
                                type="button"
                                onClick={() => onMetricChange('day')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                                    activeMetric === 'day' ? 'bg-primary text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Per Hari
                            </button>
                        </div>
                    </div>

                    {/* Comparison Switch: Akumulasi vs Per-Platform */}
                    <div className="flex items-center gap-1.5">
                        <span className="mr-1 text-[10px] font-bold tracking-wider text-slate-600 uppercase">Mode Grafik:</span>
                        <div className="inline-flex rounded-lg border border-slate-300 bg-white p-0.5 shadow-xs">
                            <button
                                type="button"
                                onClick={() => setComparisonMode('accumulated')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                                    comparisonMode === 'accumulated' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Layers className="h-3.5 w-3.5" />
                                Total Akumulasi
                            </button>
                            <button
                                type="button"
                                onClick={() => setComparisonMode('stacked')}
                                className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition ${
                                    comparisonMode === 'stacked' ? 'bg-sky-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
                                }`}
                            >
                                <Layers2 className="h-3.5 w-3.5" />
                                Perbandingan Platform
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-3 py-6">
                        <Skeleton className="h-8 w-full rounded-lg" />
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                ) : null}

                {!loading && error ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-center text-sm text-rose-700">{error}</div>
                ) : null}

                {!loading && !error && data ? (
                    <div className="min-w-0 space-y-3">
                        <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-xl border border-slate-200 bg-white p-2">
                            <ChartContainer
                                config={chartConfig}
                                className="aspect-auto w-full"
                                style={{
                                    width: isMonthlyMetric ? `max(100%, ${monthlyMinChartWidth}px)` : `${chartWidth}px`,
                                    height: '360px',
                                }}
                            >
                                <BarChart
                                    accessibilityLayer
                                    data={chartData}
                                    margin={{
                                        top: 24,
                                        left: 8,
                                        right: 8,
                                        bottom: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="period"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        interval={0}
                                        tickFormatter={(value) => {
                                            const period = String(value);
                                            if (isMonthlyMetric) {
                                                return period.slice(0, 3);
                                            }
                                            return period.length > 7 ? `${period.slice(0, 7)}...` : period;
                                        }}
                                        angle={!isMonthlyMetric && chartData.length > 16 ? -35 : 0}
                                        textAnchor={!isMonthlyMetric && chartData.length > 16 ? 'end' : 'middle'}
                                        height={!isMonthlyMetric && chartData.length > 16 ? 62 : 34}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={({ active, payload }) => {
                                            if (!active || !payload || !payload.length) {
                                                return null;
                                            }

                                            const dataPoint = payload[0]?.payload;
                                            if (!dataPoint) {
                                                return null;
                                            }

                                            return (
                                                <div className="min-w-56 space-y-2 rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-xl backdrop-blur">
                                                    <div className="flex items-center justify-between border-b border-slate-100 pb-1.5 font-bold">
                                                        <span className="text-slate-800">{dataPoint.period}</span>
                                                        <span className="text-sm font-extrabold text-primary">
                                                            {formatCurrency(Number(dataPoint.value) || 0)}
                                                        </span>
                                                    </div>

                                                    {comparisonMode === 'stacked' && availablePlatforms.length > 0 && (
                                                        <div className="space-y-1 border-b border-slate-100 py-1">
                                                            <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                                                                Kontribusi Platform:
                                                            </p>
                                                            {availablePlatforms.map((p) => {
                                                                const pVal = dataPoint[p.key] ?? 0;
                                                                const pColor = (PLATFORM_COLORS[p.key] ?? DEFAULT_COLOR).bg;
                                                                if (pVal <= 0) return null;
                                                                const pct = dataPoint.value > 0 ? ((pVal / dataPoint.value) * 100).toFixed(1) : '0';
                                                                return (
                                                                    <div key={p.key} className="flex items-center justify-between gap-3 text-[11px]">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <span
                                                                                className="h-2 w-2 shrink-0 rounded-full"
                                                                                style={{ backgroundColor: pColor }}
                                                                            />
                                                                            <span className="font-medium text-slate-600">{p.label}</span>
                                                                        </div>
                                                                        <span className="font-semibold text-slate-800">
                                                                            {formatCurrency(pVal)}{' '}
                                                                            <span className="text-[10px] text-slate-400">({pct}%)</span>
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}

                                                    {isMonthlyMetric ? (
                                                        <div className="space-y-1 border-t pt-1.5 text-[11px]">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-500">vs Bulan lalu</span>
                                                                {dataPoint.change_direction === 'up' && (
                                                                    <span className="flex items-center font-bold text-emerald-600">
                                                                        <ArrowUpRight className="mr-0.5 h-3 w-3" />+
                                                                        {dataPoint.change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.change_direction === 'down' && (
                                                                    <span className="flex items-center font-bold text-rose-600">
                                                                        <ArrowDownRight className="mr-0.5 h-3 w-3" />-
                                                                        {dataPoint.change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.change_direction === 'flat' && (
                                                                    <span className="font-medium text-slate-500">Stabil</span>
                                                                )}
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-slate-500">vs Rata-rata</span>
                                                                {dataPoint.avg_change_direction === 'up' && (
                                                                    <span className="flex items-center font-bold text-indigo-600">
                                                                        <ArrowUpRight className="mr-0.5 h-3 w-3" />+
                                                                        {dataPoint.avg_change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.avg_change_direction === 'down' && (
                                                                    <span className="flex items-center font-bold text-amber-600">
                                                                        <ArrowDownRight className="mr-0.5 h-3 w-3" />-
                                                                        {dataPoint.avg_change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.avg_change_direction === 'flat' && (
                                                                    <span className="font-medium text-slate-500">Stabil</span>
                                                                )}
                                                            </div>
                                                            {dataPoint.avg_value > 0 && (
                                                                <div className="flex items-center justify-between border-t pt-1">
                                                                    <span className="text-slate-400">Rata-rata</span>
                                                                    <span className="font-semibold text-slate-700">{formatCurrency(dataPoint.avg_value)}</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        dataPoint.change_percentage > 0 && (
                                                            <div className="flex items-center justify-between pt-0.5 text-[11px]">
                                                                <span className="text-slate-500">Perubahan:</span>
                                                                {dataPoint.change_direction === 'up' && (
                                                                    <span className="flex items-center font-bold text-emerald-600">
                                                                        <ArrowUpRight className="mr-0.5 h-3 w-3" />+
                                                                        {dataPoint.change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.change_direction === 'down' && (
                                                                    <span className="flex items-center font-bold text-rose-600">
                                                                        <ArrowDownRight className="mr-0.5 h-3 w-3" />-
                                                                        {dataPoint.change_percentage.toFixed(2)}%
                                                                    </span>
                                                                )}
                                                                {dataPoint.change_direction === 'flat' && (
                                                                    <span className="font-medium text-slate-500">Stabil</span>
                                                                )}
                                                            </div>
                                                        )
                                                    )}
                                                </div>
                                            );
                                        }}
                                    />

                                    {comparisonMode === 'accumulated' ? (
                                        <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]}>
                                            <LabelList
                                                dataKey="value"
                                                position="top"
                                                offset={12}
                                                className="fill-foreground"
                                                fontSize={11}
                                                formatter={(val: number) => formatCompactCurrency(val)}
                                            />
                                            <LabelList
                                                dataKey="change_percentage"
                                                position="top"
                                                offset={26}
                                                fontSize={9}
                                                formatter={(val: number, _name: any, props: any) => {
                                                    const payload = props?.payload;
                                                    if (!val || !payload || payload.change_direction === 'flat') return '';
                                                    const arrow = payload.change_direction === 'up' ? '↑' : '↓';
                                                    return `${arrow} ${val.toFixed(1)}%`;
                                                }}
                                            />
                                        </Bar>
                                    ) : (
                                        availablePlatforms.map((platform, idx) => {
                                            const colorConfig = PLATFORM_COLORS[platform.key] ?? DEFAULT_COLOR;
                                            const isTopBar = idx === availablePlatforms.length - 1;
                                            return (
                                                <Bar
                                                    key={platform.key}
                                                    dataKey={platform.key}
                                                    name={platform.label}
                                                    stackId="a"
                                                    fill={colorConfig.bg}
                                                    radius={isTopBar ? [6, 6, 0, 0] : [0, 0, 0, 0]}
                                                />
                                            );
                                        })
                                    )}
                                </BarChart>
                            </ChartContainer>
                        </div>

                        {/* Platform Legend when in stacked/per-platform mode */}
                        {comparisonMode === 'stacked' && availablePlatforms.length > 0 && (
                            <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                                {availablePlatforms.map((platform) => {
                                    const colorConfig = PLATFORM_COLORS[platform.key] ?? DEFAULT_COLOR;
                                    return (
                                        <div key={platform.key} className="flex items-center gap-1.5 text-xs">
                                            <span
                                                className="h-3 w-3 rounded-sm border border-black/10 shadow-2xs"
                                                style={{ backgroundColor: colorConfig.bg }}
                                            />
                                            <span className="font-medium text-slate-700">{platform.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
