import { Search } from "lucide-react";

const SearchInput = ({ value, onChange, placeholder = "Search..." }) => {
  return (
    <div className="relative w-full max-w-xs">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="h-10 w-full rounded-md border border-neutral-300 bg-white pl-9 pr-3 text-[14px] text-neutral-900
          shadow-xs transition-all duration-150 placeholder:text-neutral-400
          hover:border-neutral-400 focus:border-indigo-500 focus:outline-none focus:ring-[3px] focus:ring-indigo-500/15"
      />
    </div>
  );
};

export default SearchInput;