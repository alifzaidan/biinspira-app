import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from 'recharts';
import type { DrilldownData } from '../types';
import { formatCompactCurrency, formatCurrency } from '../utils';

type PlatformDrilldownDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    loading: boolean;
    error: string | null;
    data: DrilldownData | null;
    platformLogo?: string | null;
};

function getPlatformInitials(label?: string) {
    if (!label) return 'NA';
    return label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function ChangePill({
    percentage,
    direction,
    variant = 'month',
}: {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    variant?: 'month' | 'avg';
}) {
    if (direction === 'flat' || percentage === 0) {
        return <span className="text-[10px] font-semibold text-slate-400">Stabil</span>;
    }
    const isUp = direction === 'up';
    const styles =
        variant === 'avg'
            ? isUp
                ? 'border border-indigo-200 bg-indigo-50 text-indigo-700'
                : 'border border-amber-200 bg-amber-50 text-amber-700'
            : isUp
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-rose-50 text-rose-600';

    return (
        <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${styles}`}>
            {isUp ? <ArrowUpRight className="h-2.5 w-2.5" /> : <ArrowDownRight className="h-2.5 w-2.5" />}
            {isUp ? '+' : '-'}{percentage.toFixed(1)}%
        </span>
    );
}

export default function PlatformDrilldownDialog({ open, onOpenChange, loading, error, data, platformLogo }: PlatformDrilldownDialogProps) {
    const chartConfig = {
        value: { label: 'Nominal', color: 'var(--chart-2)' },
    } satisfies ChartConfig;

    const isMonthlyMetric = data?.metric === 'month';

    const chartData = useMemo(() => {
        if (!data) return [];
        return data.points.map((point) => ({
            period: point.label,
            value: point.value,
            change_percentage: point.change_percentage ?? 0,
            change_direction: point.change_direction ?? 'flat',
            avg_change_percentage: point.avg_change_percentage ?? 0,
            avg_change_direction: point.avg_change_direction ?? 'flat',
            avg_value: point.avg_value ?? 0,
        }));
    }, [data]);

    const chartWidth = useMemo(() => {
        return Math.min(1600, Math.max(620, chartData.length * 52));
    }, [chartData]);

    const monthlyMinChartWidth = useMemo(() => {
        return Math.max(620, chartData.length * 52);
    }, [chartData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] overflow-hidden sm:max-w-5xl">
                <DialogHeader>
                    <DialogTitle>{data?.title ?? 'Rincian Statistik'}</DialogTitle>
                    <DialogDescription>{data ? data.subtitle : 'Memuat data rincian...'}</DialogDescription>
                </DialogHeader>

                {data ? (
                    <div className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {platformLogo ? (
                            <img src={platformLogo} alt={data.platform_label} className="h-8 w-auto max-w-16 object-contain" />
                        ) : (
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 bg-white text-[10px] font-bold text-slate-600">
                                {getPlatformInitials(data.platform_label)}
                            </div>
                        )}
                        <div className="min-w-0 text-sm text-slate-700">
                            <span className="font-semibold text-slate-900">{data.platform_label}</span>
                            <span className="truncate text-slate-500"> • {data.subtitle}</span>
                        </div>
                    </div>
                ) : null}

                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((item) => (
                            <Skeleton key={item} className="h-9 w-full" />
                        ))}
                    </div>
                ) : null}

                {!loading && error ? (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
                ) : null}

                {!loading && !error && data ? (
                    <div className="min-w-0 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                                Total Periode: <span className="font-semibold text-slate-900">{formatCurrency(data.total)}</span>
                            </div>
                        </div>

                        <div className="w-full max-w-full min-w-0 overflow-x-auto rounded-lg border border-slate-200 bg-white p-2">
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
                                    margin={{ top: 20, left: 8, right: 8, bottom: 8 }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="period"
                                        tickLine={false}
                                        tickMargin={10}
                                        axisLine={false}
                                        interval={0}
                                        tickFormatter={(value) => {
                                            const period = String(value);
                                            if (isMonthlyMetric) return period.slice(0, 3);
                                            return period.length > 7 ? `${period.slice(0, 7)}...` : period;
                                        }}
                                        angle={!isMonthlyMetric && chartData.length > 16 ? -35 : 0}
                                        textAnchor={!isMonthlyMetric && chartData.length > 16 ? 'end' : 'middle'}
                                        height={!isMonthlyMetric && chartData.length > 16 ? 62 : 34}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                indicator="line"
                                                formatter={(value, _name, item) => {
                                                    const payload = item.payload as any;
                                                    const prevChange = {
                                                        percentage: payload.change_percentage as number,
                                                        direction: payload.change_direction as 'up' | 'down' | 'flat',
                                                    };
                                                    const avgChange = {
                                                        percentage: payload.avg_change_percentage as number,
                                                        direction: payload.avg_change_direction as 'up' | 'down' | 'flat',
                                                    };

                                                    return (
                                                        <div className="space-y-1.5">
                                                            <div className="flex items-center justify-between gap-2">
                                                                <span className="text-muted-foreground">{payload.period}</span>
                                                                <span className="font-medium text-foreground">{formatCurrency(Number(value) || 0)}</span>
                                                            </div>
                                                            {isMonthlyMetric && (
                                                                <div className="space-y-1 border-t pt-1.5 text-xs">
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-slate-500">vs Bulan lalu</span>
                                                                        <ChangePill percentage={prevChange.percentage} direction={prevChange.direction} variant="month" />
                                                                    </div>
                                                                    <div className="flex items-center justify-between gap-2">
                                                                        <span className="text-slate-500">vs Rata-rata</span>
                                                                        <ChangePill percentage={avgChange.percentage} direction={avgChange.direction} variant="avg" />
                                                                    </div>
                                                                    {payload.avg_value > 0 && (
                                                                        <div className="flex items-center justify-between gap-2 border-t pt-1">
                                                                            <span className="text-[10px] text-slate-400">Rata-rata</span>
                                                                            <span className="text-[10px] font-semibold text-slate-700">
                                                                                {formatCurrency(payload.avg_value)}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {!isMonthlyMetric && payload.change_percentage > 0 && (
                                                                <div className="flex items-center gap-1.5 border-t pt-1 text-xs">
                                                                    {payload.change_direction === 'up' && (
                                                                        <>
                                                                            <ArrowUpRight className="h-3 w-3 text-emerald-600" />
                                                                            <span className="font-semibold text-emerald-600">
                                                                                +{payload.change_percentage.toFixed(2)}%
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {payload.change_direction === 'down' && (
                                                                        <>
                                                                            <ArrowDownRight className="h-3 w-3 text-rose-600" />
                                                                            <span className="font-semibold text-rose-600">
                                                                                -{payload.change_percentage.toFixed(2)}%
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                    {payload.change_direction === 'flat' && (
                                                                        <span className="text-slate-500">Stabil</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                }}
                                            />
                                        }
                                    />
                                    <Bar dataKey="value" fill="var(--color-value)" radius={8}>
                                        <LabelList
                                            dataKey="value"
                                            position="top"
                                            offset={12}
                                            className="fill-foreground"
                                            fontSize={11}
                                            formatter={(value: number) => formatCompactCurrency(value)}
                                        />
                                        <LabelList
                                            dataKey="change_percentage"
                                            position="top"
                                            offset={26}
                                            fontSize={9}
                                            formatter={(value: number, _name: any, props: any) => {
                                                const payload = props?.payload;
                                                if (!value || !payload || payload.change_direction === 'flat') return '';
                                                const arrow = payload.change_direction === 'up' ? '↑' : '↓';
                                                return `${arrow} ${value.toFixed(1)}%`;
                                            }}
                                        />
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
