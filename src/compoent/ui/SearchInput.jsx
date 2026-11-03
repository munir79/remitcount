import { Search } from "lucide-react";

const SearchInput = ({ id, value, onChange, placeholder = "Search...", className = "max-w-xs" }) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-lg border border-slate-300 bg-white pl-9 pr-3 text-sm text-slate-900 shadow-[0_1px_2px_rgb(16_24_40/0.04)]
          transition-[border-color,box-shadow] duration-150 placeholder:text-slate-400
          hover:border-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
      />
    </div>
  );
};

export default SearchInput;
