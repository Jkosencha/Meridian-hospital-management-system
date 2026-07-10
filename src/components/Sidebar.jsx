export default function Sidebar({ navItems, activeKey, onSelect, user, onLogout }) {
  return (
    <aside className="w-56 shrink-0 bg-brand-navy text-slate-300 flex flex-col">
      <div className="px-5 py-5 border-b border-brand-navy-light">
        <p className="text-white font-semibold text-sm tracking-wide">MERIDIAN</p>
        <p className="text-xs text-slate-400 mt-0.5">Hospital System</p>
      </div>

      <nav className="flex-1 py-3">
        {navItems.map((item) => {
          const isActive = item.key === activeKey
          return (
            <button
              key={item.key}
              onClick={() => onSelect(item.key)}
              className={`w-full text-left px-5 py-2.5 text-sm border-l-2 transition-colors ${
                isActive
                  ? 'border-brand-accent bg-brand-navy-light text-white'
                  : 'border-transparent text-slate-400 hover:bg-brand-navy-light/60 hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </nav>

      <div className="border-t border-brand-navy-light px-5 py-4">
        <p className="text-sm text-slate-100 truncate">{user?.name}</p>
        <p className="text-xs text-slate-400 capitalize">{user?.role}</p>
        <button
          onClick={onLogout}
          className="mt-2 text-xs uppercase tracking-wide text-slate-500 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </aside>
  )
}
