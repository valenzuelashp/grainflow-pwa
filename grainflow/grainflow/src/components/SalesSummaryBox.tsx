import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SalesSummaryBoxProps {
  label: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
  trendPercent?: number;
}

const SalesSummaryBox = ({ label, value, trend, trendPercent }: SalesSummaryBoxProps) => {
  const trendConfig = {
    up: {
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    down: {
      icon: TrendingDown,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    neutral: {
      icon: Minus,
      color: 'text-gray-400',
      bg: 'bg-gray-50',
    },
  };

  const { icon: TrendIcon, color, bg } = trendConfig[trend];

  return (
    <div className="bg-white p-3 sm:p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-[6px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
        <h3 className="text-[12px] sm:text-xl font-black text-gray-900">{value}</h3>
      </div>
      <div className={`flex items-center gap-0.5 px-1.5 sm:px-2 py-1 sm:py-2 rounded-2xl ${bg}`}>
        <TrendIcon size={12} className={`${color} sm:w-[16px] sm:h-[16px]`} />
        {trendPercent !== undefined && (
          <span className={`text-[4px] sm:text-[8px] font-black ${color}`}>{trendPercent}%</span>
        )}
      </div>
    </div>
  );
};

export default SalesSummaryBox;
