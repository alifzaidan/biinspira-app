import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ArrowDownRight, ArrowRight, ArrowUpRight } from 'lucide-react';
import { formatCurrency } from '../utils';

type ChangeBadgeProps = {
    percentage: number;
    direction: 'up' | 'down' | 'flat';
    yesterday?: number;
};

export default function ChangeBadge({ percentage, direction, yesterday }: ChangeBadgeProps) {
    const isUp = direction === 'up';
    const isDown = direction === 'down';
    const styles = isUp
        ? 'border-emerald-400/80 bg-emerald-100 text-emerald-800'
        : isDown
          ? 'border-rose-400/80 bg-rose-100 text-rose-800'
          : 'border-slate-300/80 bg-slate-100 text-slate-700';

    const Icon = isUp ? ArrowUpRight : isDown ? ArrowDownRight : ArrowRight;
    const valueText = isUp ? `+${percentage.toFixed(2)}%` : isDown ? `-${percentage.toFixed(2)}%` : '0%';
    const statusLabel = isUp ? 'Naik' : isDown ? 'Turun' : 'Stabil';
    const yesterdayText = yesterday !== undefined ? formatCurrency(yesterday) : null;
    const titleText = yesterdayText ? `Kemarin (${statusLabel}): ${yesterdayText}` : undefined;

    const badge = (
        <span
            title={titleText}
            className={`inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2 py-0.5 text-[10px] font-bold sm:text-xs ${styles} ${yesterdayText ? 'cursor-pointer' : ''}`}
        >
            <Icon className="h-3 w-3 shrink-0 stroke-[2.5]" />
            <span>{valueText}</span>
        </span>
    );

    if (yesterdayText === null) {
        return badge;
    }

    return (
        <Tooltip>
            <TooltipTrigger asChild>{badge}</TooltipTrigger>
            <TooltipContent side="top" className="border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-xl">
                <p className={`text-[10px] font-semibold ${isUp ? 'text-emerald-300' : isDown ? 'text-rose-300' : 'text-slate-300'}`}>
                    vs Kemarin ({statusLabel})
                </p>
                <p className="text-xs font-bold text-white">{yesterdayText}</p>
            </TooltipContent>
        </Tooltip>
    );
}
