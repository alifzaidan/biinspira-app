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
function AvgChangeBadge({ percentage, direction }: { percentage: number; direction: 'up' | 'down' | 'flat' }) {
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

    return (
        <span
            title="vs Rata-rata"
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${styles}`}
        >
            <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <span>{label}</span>
        </span>
    );
}

// Badge vs Bulan Lalu (sebelah kanan) - warna Emerald (naik) / Rose (turun)
function MonthChangeBadge({ percentage, direction }: { percentage: number; direction: 'up' | 'down' | 'flat' }) {
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

    return (
        <span
            title="vs Bulan Lalu"
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[10px] font-bold sm:text-xs ${styles}`}
        >
            <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <span>{label}</span>
        </span>
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
                        <AvgChangeBadge percentage={item.avg_change_percentage} direction={item.avg_change_direction} />
                        <MonthChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} />
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
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} />
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
                        <AvgChangeBadge percentage={item.avg_change_percentage} direction={item.avg_change_direction} />
                        <MonthChangeBadge percentage={item.month_change_percentage} direction={item.month_change_direction} />
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
                        <ChangeBadge percentage={item.day_change_percentage} direction={item.day_change_direction} />
                    </div>
                    <p className="mt-2 text-[10px] text-slate-500">Rincian per hari</p>
                </button>
            </div>
        </div>
    );
}
