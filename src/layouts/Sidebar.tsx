import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from '@/components/brand/Logo';
import { cn } from '@/lib/utils';
import { NAV_GROUPS } from '@/navigation';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUiStore } from '@/stores/uiStore';

function pathActive(pathname: string, path: string): boolean {
  if (path === '/') return pathname === '/';
  return pathname === path || pathname.startsWith(`${path}/`);
}

export function Sidebar() {
  const location = useLocation();
  const collapsed = useSettingsStore((s) => s.sidebarCollapsed);
  const toggleCollapsed = useSettingsStore((s) => s.toggleSidebarCollapsed);
  const accordionMode = useSettingsStore((s) => s.sidebarAccordionMode);
  const mobileOpen = useUiStore((s) => s.mobileSidebarOpen);
  const setMobileOpen = useUiStore((s) => s.setMobileSidebarOpen);

  const activeGroupId = useMemo(() => {
    for (const group of NAV_GROUPS) {
      if (group.items.some((item) => pathActive(location.pathname, item.path))) {
        return group.id;
      }
    }
    return NAV_GROUPS[0]?.id ?? 'mission';
  }, [location.pathname]);

  const [openGroups, setOpenGroups] = useState<string[]>([activeGroupId]);

  useEffect(() => {
    setOpenGroups((prev) => {
      if (accordionMode === 'single') return [activeGroupId];
      return prev.includes(activeGroupId) ? prev : [...prev, activeGroupId];
    });
  }, [activeGroupId, accordionMode]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      if (accordionMode === 'single') {
        return prev.includes(id) && prev.length === 1 ? prev : [id];
      }
      return prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id];
    });
  }

  const aside = (
    <aside
      className={cn(
        'flex h-full flex-col border-r border-border bg-bg-elevated/90 backdrop-blur-xl transition-[width] duration-300',
        collapsed ? 'w-[4.5rem]' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex h-16 items-center border-b border-border px-3',
          collapsed ? 'justify-center' : 'justify-between gap-2',
        )}
      >
        <Logo
          size="sm"
          variant={collapsed ? 'mark' : 'full'}
          showWordmark={!collapsed}
          showMotto={false}
          className={cn(collapsed && 'justify-center')}
        />
        {!collapsed ? (
          <button
            type="button"
            onClick={toggleCollapsed}
            className="hidden rounded-md p-2 text-text-muted hover:bg-surface hover:text-text lg:inline-flex"
            aria-label="Collapse sidebar"
          >
            <PanelLeftClose className="size-4" />
          </button>
        ) : null}
      </div>

      {collapsed ? (
        <div className="flex justify-center border-b border-border py-2">
          <button
            type="button"
            onClick={toggleCollapsed}
            className="rounded-md p-2 text-text-muted hover:bg-surface hover:text-text"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen className="size-4" />
          </button>
        </div>
      ) : null}

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {NAV_GROUPS.map((group) => {
          const open = collapsed || openGroups.includes(group.id);

          return (
            <div key={group.id} className="mb-1">
              {!collapsed ? (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center justify-between rounded-md px-2.5 py-2 text-[11px] font-semibold tracking-[0.14em] text-text-muted uppercase hover:bg-surface/80"
                >
                  {group.label}
                  <motion.span
                    animate={{ rotate: open ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="size-3.5" />
                  </motion.span>
                </button>
              ) : null}

              <AnimatePresence initial={false}>
                {open ? (
                  <motion.ul
                    key={`${group.id}-items`}
                    initial={collapsed ? false : { height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {group.items.map((item) => {
                      const active = pathActive(location.pathname, item.path);
                      const Icon = item.icon;
                      return (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            end={item.path === '/'}
                            title={collapsed ? item.label : undefined}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'group relative mx-1 my-0.5 flex items-center gap-3 rounded-[var(--radius-md)] px-2.5 py-2 text-sm transition-colors',
                              active
                                ? 'bg-accent-soft text-text'
                                : 'text-text-muted hover:bg-surface hover:text-text',
                              collapsed && 'justify-center px-0',
                            )}
                          >
                            {active ? (
                              <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                            ) : null}
                            <Icon
                              className={cn(
                                'size-4 shrink-0',
                                active ? 'text-accent' : 'text-text-muted group-hover:text-text',
                              )}
                            />
                            {!collapsed ? (
                              <span className="truncate font-medium">{item.label}</span>
                            ) : null}
                          </NavLink>
                        </li>
                      );
                    })}
                  </motion.ul>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </nav>

      {!collapsed ? (
        <div className="border-t border-border p-3 text-[11px] text-text-muted">
          God • Goals • Grinding • Gratitude
        </div>
      ) : null}
    </aside>
  );

  return (
    <>
      <div className="sticky top-0 hidden h-screen shrink-0 lg:block">{aside}</div>

      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.button
              type="button"
              aria-label="Close sidebar"
              className="fixed inset-0 z-40 bg-[#0b1220]/55 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.div
              className="fixed inset-y-0 left-0 z-50 w-72 lg:hidden"
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              {aside}
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
