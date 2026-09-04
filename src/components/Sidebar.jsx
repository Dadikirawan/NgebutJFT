import { useMemo } from 'react';

export default function Sidebar({
  sections,
  route,
  navigate,
  startQuiz,
  sectionProgress,
  bonusProgress,
  onMobileOpen,
  onMobileClose,
  onToggleCollapse,
  collapsed,
}) {
  const menu = useMemo(() => {
    return [
      {
        id: 'dashboard',
        labelId: 'Home',
        labelJp: 'ホーム',
        icon: '🏠',
        action: () => navigate('dashboard'),
        isActive: route.name === 'dashboard',
        meta: null,
      },
      ...sections.map((s) => ({
        id: `section-${s.id}`,
        labelId: s.name_id,
        labelJp: s.name,
        icon: s.id === 1 ? '🔤' : s.id === 2 ? '💬' : s.id === 3 ? '🎧' : '📖',
        action: () => startQuiz('section', s.id),
        isActive: false,
        meta: sectionProgress(s.id),
      })),
      {
        id: 'bonus',
        labelId: 'Bonus',
        labelJp: 'ニュアンス',
        icon: '🎁',
        action: () => startQuiz('bonus'),
        isActive: false,
        meta: bonusProgress(),
      },
      {
        id: 'progress',
        labelId: 'Progress',
        labelJp: '学習進捗',
        icon: '📊',
        action: () => navigate('progress'),
        isActive: route.name === 'progress',
        meta: null,
      },
    ];
  }, [sections, route.name, navigate, startQuiz, sectionProgress, bonusProgress]);

  function doActionMobile(item) {
    item.action();
    onMobileClose?.();
  }

  function doAction(item) {
    item.action();
  }

  return (
    <>
      {/* MOBILE (<768px): overlay drawer */}
      <div
        className={`sidebar-mask sidebar-mobile-only ${onMobileOpen ? 'open' : ''}`}
        onClick={onMobileClose}
        aria-hidden="true"
      />
      <aside
        className={`sidebar sidebar-mobile sidebar-mobile-only ${onMobileOpen ? 'open' : ''}`}
        aria-label="Navigasi utama (mobile)"
      >
        <SidebarBrand collapsed={false} onToggle={null} />
        <SidebarMenu menu={menu} collapsed={false} onAction={doActionMobile} activeRoute={route.name} />
        <SidebarFooter collapsed={false} />
      </aside>

      {/* TABLET (768–1023px): collapsible */}
      <aside
        className={`sidebar sidebar-tablet sidebar-tablet-only ${collapsed ? 'collapsed' : ''}`}
        aria-label="Navigasi utama (tablet)"
      >
        <SidebarBrand collapsed={collapsed} onToggle={onToggleCollapse} />
        <SidebarMenu menu={menu} collapsed={collapsed} onAction={doAction} activeRoute={route.name} />
        <SidebarFooter collapsed={collapsed} />
      </aside>

      {/* DESKTOP (>=1024px): fixed 260px */}
      <aside
        className="sidebar sidebar-desktop sidebar-desktop-only"
        aria-label="Navigasi utama"
      >
        <SidebarBrand collapsed={false} onToggle={null} />
        <SidebarMenu menu={menu} collapsed={false} onAction={doAction} activeRoute={route.name} />
        <SidebarFooter collapsed={false} />
      </aside>
    </>
  );
}

function SidebarBrand({ collapsed, onToggle }) {
  return (
    <div className="sidebar-brand" translate="no">
      <div className="brand" style={{ padding: 0, background: 'transparent', border: 'none', color: 'inherit' }}>
        <span className="brand-mark" aria-hidden="true">J</span>
        {!collapsed && (
          <span className="brand-text">
            <span className="main">NgebutJFT</span>
            <span className="sub">JFT-BASIC</span>
          </span>
        )}
      </div>
      {typeof onToggle === 'function' && (
        <button
          type="button"
          className="sb-collapse"
          aria-label={collapsed ? 'Buka sidebar' : 'Sembunyikan sidebar'}
          onClick={onToggle}
        >
          <span aria-hidden="true">{collapsed ? '»' : '«'}</span>
        </button>
      )}
    </div>
  );
}

function SidebarMenu({ menu, collapsed, onAction, activeRoute }) {
  return (
    <nav className="sb-menu">
      {menu.map((item) => {
        const pct = item.meta?.pct ?? null;
        return (
          <button
            key={item.id}
            type="button"
            className={`sb-item ${activeRoute && item.isActive ? 'active' : ''} ${collapsed ? 'collapsed' : ''}`}
            title={`${item.labelJp} — ${item.labelId}${pct != null ? ` • ${pct}%` : ''}`}
            onClick={() => onAction(item)}
          >
            <span className="sb-icon" aria-hidden="true">{item.icon}</span>
            {!collapsed && (
              <span className="sb-label">
                <span className="sb-jp" translate="no">{item.labelJp}</span>
                <span className="sb-id">{item.labelId}</span>
              </span>
            )}
            {!collapsed && pct != null && <span className="sb-pill">{pct}%</span>}
          </button>
        );
      })}
    </nav>
  );
}

function SidebarFooter({ collapsed }) {
  return (
    <div className={`sidebar-footer ${collapsed ? 'collapsed' : ''}`}>
      {!collapsed && (
        <span className="copy-full">© 2026 Dadik Irawan. All rights reserved.</span>
      )}
    </div>
  );
}
