interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onChange: (start: string, end: string) => void;
  error?: string;
}

const DateRangePicker = ({ startDate, endDate, onChange, error }: DateRangePickerProps) => {
  const handleStart = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value, endDate);
  };

  const handleEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(startDate, e.target.value);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-3">
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Date Range</p>
      <div className="flex gap-3 items-center">
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">From</label>
          <input
            type="date"
            value={startDate}
            onChange={handleStart}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>
        <span className="text-gray-400 font-black mt-4">→</span>
        <div className="flex-1">
          <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">To</label>
          <input
            type="date"
            value={endDate}
            onChange={handleEnd}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-900 outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-red-500 text-[10px] font-bold">{error}</p>}
    </div>
  );
};

export default DateRangePicker;
