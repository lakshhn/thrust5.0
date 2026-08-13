import { Search } from 'lucide-react'

/**
 * SearchInput — team filter input
 */
export default function SearchInput({ value, onChange, placeholder = 'Search teams…' }) {
  return (
    <div className="search-wrapper">
      <Search
        size={14}
        className="search-icon"
        aria-hidden="true"
        strokeWidth={2}
      />
      <input
        id="team-search"
        type="search"
        className="search-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search teams by name or code"
        autoComplete="off"
        spellCheck={false}
      />
    </div>
  )
}
