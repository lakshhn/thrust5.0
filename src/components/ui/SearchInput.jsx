import { Search } from 'lucide-react'

export default function SearchInput({ value, onChange, placeholder = 'Search team name or code...' }) {
  return (
    <div className="relative flex items-center w-full sm:w-72 group">
      <Search
        size={15}
        className="absolute left-3.5 text-cyan-400/70 pointer-events-none group-focus-within:text-cyan-400 transition-colors"
        strokeWidth={2.2}
      />
      <input
        id="team-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-3.5 py-2 bg-[#080D1A] border border-slate-700/80 rounded-xl text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/40 transition-all shadow-inner"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
