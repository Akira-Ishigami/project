interface FilterButtonsProps {
  options: Array<{
    value: string;
    label: string;
  }>;
  selected: string;
  onSelect: (value: string) => void;
}

export default function FilterButtons({ options, selected, onSelect }: FilterButtonsProps) {
  return (
    <div className="flex gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onSelect(option.value)}
          className={`flex-1 px-4 py-2.5 rounded-lg font-medium text-sm transition-all duration-200 ${
            selected === option.value
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30 transform scale-[1.02]'
              : 'bg-white text-slate-600 hover:bg-slate-50 hover:scale-[1.02] border border-slate-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
