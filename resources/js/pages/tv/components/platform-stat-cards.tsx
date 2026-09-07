import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import type { DrilldownMetric, PlatformStat } from '../types';
import { formatCurrency } from '../utils';
import ChangeBadge from './change-badge';

type CardProps = {
    item: PlatformStat;
    className?: string;
    onOpenDetail: (platformKey: string, metric: DrilldownMetric) => void;
};

function PlatformLogo({ item }: { item: PlatformStat }) {
    if (item.logo) {
        return <img src={item.logo} alt={item.label} className="max-h-7 w-auto max-w-24 object-contain" />;
    }

    return (
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-slate-300 bg-white">
            <span className="text-[10px] font-bold text-slate-600">{item.label.slice(0, 2).toUpperCase()}</span>
        </div>
    );
}

// Badge vs Rata-rata (sebelah kiri) - warna Indigo (naik) / Amber-Oranye (turun)
function AvgChangeBadge({
    percentage,
    direction,
    monthlyAvg,
}: {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    monthlyAvg?: number;
}) {
    const isUp = direction === 'up';
    const isDown = direction === 'down';
    const styles = isUp
        ? 'border-indigo-400/80 bg-indigo-100 text-indigo-800'
        : isDown
          ? 'border-amber-400/80 bg-amber-100 text-amber-800'
          : 'border-slate-300/80 bg-slate-100 text-slate-700';
    const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : ArrowRight;
    const sign = isUp ? '+' : isDown ? '-' : '';
    const label = direction === 'flat' ? '0%' : `${sign}${percentage.toFixed(2)}%`;
    const avgText = monthlyAvg !== undefined ? formatCurrency(monthlyAvg) : null;
    const statusLabel = isUp ? 'Naik' : isDown ? 'Turun' : 'Stabil';
    const tooltipTitle = `vs Rata-rata (${statusLabel})`;
    const titleText = avgText ? `${tooltipTitle}: ${avgText}` : tooltipTitle;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    title={titleText}
                    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${styles} cursor-pointer`}
                >
                    <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
                    <span>{label}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-xl">
                <p className={`text-[10px] font-semibold ${isUp ? 'text-indigo-300' : isDown ? 'text-amber-300' : 'text-slate-300'}`}>
                    vs Rata-rata Bulanan ({statusLabel})
                </p>
                {avgText && <p className="text-xs font-bold text-white">{avgText}</p>}
            </TooltipContent>
        </Tooltip>
    );
}

// Badge vs Bulan Lalu (sebelah kanan) - warna Emerald (naik) / Rose (turun)
function MonthChangeBadge({
    percentage,
    direction,
    lastMonth,
}: {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    lastMonth?: number;
}) {
    const isUp = direction === 'up';
    const isDown = direction === 'down';
    const styles = isUp
        ? 'border-emerald-400/80 bg-emerald-100 text-emerald-800'
        : isDown
          ? 'border-rose-400/80 bg-rose-100 text-rose-800'
          : 'border-slate-300/80 bg-slate-100 text-slate-700';
    const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : ArrowRight;
    const sign = isUp ? '+' : isDown ? '-' : '';
    const label = direction === 'flat' ? '0%' : `${sign}${percentage.toFixed(2)}%`;
    const lastMonthText = lastMonth !== undefined ? formatCurrency(lastMonth) : null;
    const statusLabel = isUp ? 'Naik' : isDown ? 'Turun' : 'Stabil';
    const tooltipTitle = `vs Bulan Lalu (${statusLabel})`;
    const titleText = lastMonthText ? `${tooltipTitle}: ${lastMonthText}` : tooltipTitle;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <span
                    title={titleText}
                    className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${styles} cursor-pointer`}
                >
                    <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
                    <span>{label}</span>
                </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-xl">
                <p className={`text-[10px] font-semibold ${isUp ? 'text-emerald-300' : isDown ? 'text-rose-300' : 'text-slate-300'}`}>
                    vs Bulan Lalu ({statusLabel})
                </p>
                {lastMonthText && <p className="text-xs font-bold text-white">{lastMonthText}</p>}
            </TooltipContent>
        </Tooltip>
    );
}

export function PlatformStatCardGrid({ item, className, onOpenDetail }: CardProps) {
    return (
        <div
            className={cn(
                'flex min-h-0 flex-col justify-between overflow-hidden rounded-2xl border border-white/55 bg-white/88 p-2 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur xl:p-2.5',
                className,
            )}
        >
            <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
                <h2 className="truncate text-base font-bold text-slate-800 xl:text-lg" title={item.label}>
                    {item.label}
                </h2>
                <div className="flex min-h-7 shrink-0 items-center justify-end">
                    <PlatformLogo item={item} />
                </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 gap-1.5 overflow-hidden sm:grid-cols-3">
                <div className="flex min-h-0 min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 xl:p-2">
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-[11px]">Total Tahun Ini</p>
                    <p
                        className="my-auto truncate py-0.5 text-sm leading-none font-bold tracking-tight text-slate-900 sm:text-base xl:text-lg 2xl:text-3xl"
                        title={formatCurrency(item.total)}
                    >
                        {formatCurrency(item.total)}
                    </p>
                    <div className="invisible mt-0.5 flex shrink-0 items-center" aria-hidden="true">
                        <ChangeBadge percentage={0} direction="flat" />
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'month')}
                    className="flex min-h-0 min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-left transition hover:cursor-pointer hover:border-sky-300 hover:bg-sky-50 xl:p-2"
                >
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-[11px]">Bulan Ini</p>
                    <p
                        className="my-auto truncate py-0.5 text-sm leading-none font-bold tracking-tight text-slate-900 sm:text-base xl:text-lg 2xl:text-3xl"
                        title={formatCurrency(item.this_month)}
                    >
                        {formatCurrency(item.this_month)}
                    </p>
                    <div className="mt-0.5 flex shrink-0 flex-wrap items-center gap-1 sm:flex-nowrap">
                        <AvgChangeBadge
                            percentage={item.avg_change_percentage}
                            direction={item.avg_change_direction}
                            monthlyAvg={item.monthly_avg}
                        />
                        <MonthChangeBadge
                            percentage={item.month_change_percentage}
                            direction={item.month_change_direction}
                            lastMonth={item.last_month}
                        />
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'day')}
                    className="flex min-h-0 min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1.5 text-left transition hover:cursor-pointer hover:border-sky-300 hover:bg-sky-50 xl:p-2"
                >
                    <p className="mb-0.5 truncate text-[10px] font-bold tracking-wider text-slate-500 uppercase xl:text-[11px]">Hari Ini</p>
                    <p
                        className="my-auto truncate py-0.5 text-sm leading-none font-bold tracking-tight text-slate-900 sm:text-base xl:text-lg 2xl:text-3xl"
                        title={formatCurrency(item.today)}
                    >
                        {formatCurrency(item.today)}
                    </p>
                    <div className="mt-0.5 flex shrink-0 items-center">
                        <ChangeBadge
                            percentage={item.day_change_percentage}
                            direction={item.day_change_direction}
                            yesterday={item.yesterday}
                        />
                    </div>
                </button>
            </div>
        </div>
    );
}

export function PlatformStatCardCarousel({ item, className, onOpenDetail }: CardProps) {
    return (
        <div
            className={cn(
                'flex h-full min-h-0 flex-col rounded-2xl border border-white/55 bg-white/88 p-3.5 shadow-[0_8px_22px_rgba(15,23,42,0.18)] backdrop-blur',
                className,
            )}
        >
            <div className="mb-2.5 flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-slate-800">{item.label}</h2>
                <div className="flex min-h-9 items-center justify-end">
                    <PlatformLogo item={item} />
                </div>
            </div>

            <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2.5">
                <div className="col-span-2 flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Total Tahun Ini</p>
                    <p className="text-[clamp(1.5rem,2.1vw,2.4rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.total)}
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'month')}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Bulan Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.this_month)}
                    </p>
                    <div className="mt-auto flex items-center gap-1.5 pt-2">
                        <AvgChangeBadge
                            percentage={item.avg_change_percentage}
                            direction={item.avg_change_direction}
                            monthlyAvg={item.monthly_avg}
                        />
                        <MonthChangeBadge
                            percentage={item.month_change_percentage}
                            direction={item.month_change_direction}
                            lastMonth={item.last_month}
                        />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Rincian per bulan</p>
                </button>

                <button
                    type="button"
                    onClick={() => onOpenDetail(item.key, 'day')}
                    className="flex h-full flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-sky-300 hover:bg-sky-50"
                >
                    <p className="mb-1 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">Hari Ini</p>
                    <p className="text-[clamp(1.3rem,1.6vw,2rem)] leading-tight font-bold tracking-tight text-slate-800">
                        {formatCurrency(item.today)}
                    </p>
                    <div className="mt-auto pt-2">
                        <ChangeBadge
                            percentage={item.day_change_percentage}
                            direction={item.day_change_direction}
                            yesterday={item.yesterday}
                        />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Rincian per hari</p>
                </button>
            </div>
        </div>
    );
}
