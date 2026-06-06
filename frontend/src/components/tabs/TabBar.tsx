import React, { useRef, useEffect } from 'react';
import { styled } from '@linaria/react';
import { TabData } from '../../types/tabs';

interface TabBarProps {
  tabs: TabData[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  username?: string | null;
  onUserMenuToggle?: () => void;
  showUserMenu?: boolean;
  onChangePassword?: () => void;
  onLogout?: () => void;
}

const NavContainer = styled.nav`
  display: flex;
  align-items: stretch;
  border-bottom: var(--border-width) solid var(--tab-border-color);
  background-color: var(--surface-color);
  box-shadow: var(--shadow-sm);
  position: relative;
  z-index: 10;
  min-height: 52px;

  @media (max-width: 640px) {
    min-height: 48px;
  }
`;

const TabsWrapper = styled.div`
  display: flex;
  align-items: stretch;
  gap: 0;
  flex: 1;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const CloseIcon = styled.button`
  margin-left: var(--space-xs);
  padding: var(--space-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 0.85em;
  color: var(--text-color-lighter);
  opacity: 0.5;
  border-radius: 50%;
  min-width: 44px;
  min-height: 44px;
  width: auto;
  height: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 0.15s ease, opacity 0.15s ease, color 0.15s ease;

  button:hover & {
    opacity: 0.8;
  }

  &:hover,
  &:focus {
    opacity: 1;
    background-color: var(--danger-color);
    color: var(--text-on-primary);
    outline: none;
  }

  @media (max-width: 640px) {
    min-width: 36px;
    min-height: 36px;
    font-size: 0.75em;
  }
`;

const TabButton = styled.button<{ isActive: boolean }>`
  padding: 0 var(--space-md);
  border: none;
  border-bottom: 3px solid transparent;
  background-color: ${({ isActive }) =>
    isActive ? 'var(--tab-active-bg)' : 'var(--tab-inactive-bg)'};
  color: ${({ isActive }) =>
    isActive ? 'var(--primary-color)' : 'var(--text-color-light)'};
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: ${({ isActive }) => (isActive ? '600' : '500')};
  position: relative;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  min-height: 52px;
  border-radius: 0;
  box-shadow: none;
  touch-action: manipulation;

  ${({ isActive }) =>
    isActive
      ? `
    border-bottom-color: var(--tab-active-border-color);
    color: var(--primary-color);
  `
      : ''}

  &:hover:not(:disabled) {
    background-color: var(--tab-hover-bg);
    color: ${({ isActive }) =>
      isActive ? 'var(--primary-color)' : 'var(--text-color)'};
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--primary-color);
    z-index: 1;
  }

  &:active:not(:disabled) {
    transform: none;
  }

  @media (max-width: 640px) {
    padding: 0 var(--space-sm);
    font-size: var(--font-size-xs);
    min-height: 48px;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  padding: 0 var(--space-sm);

  @media (max-width: 640px) {
    padding: 0 var(--space-xs);
  }
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: border-color 0.15s ease, background-color 0.15s ease;
  min-height: 44px;
  box-shadow: none;

  &:hover {
    border-color: var(--primary-color);
    background-color: var(--surface-color-light);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--focus-ring-color);
  }

  @media (max-width: 640px) {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-xs);
    gap: var(--space-xs);
  }
`;

const Dropdown = styled.div`
  position: absolute;
  top: 100%;
  right: var(--space-md);
  margin-top: var(--space-xs);
  background-color: var(--surface-color);
  border: var(--border-width) solid var(--border-color);
  border-radius: var(--border-radius);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  min-width: 200px;
  overflow: hidden;

  @media (max-width: 640px) {
    right: var(--space-xs);
    min-width: 180px;
  }
`;

const DropdownItem = styled.button`
  display: block;
  width: 100%;
  padding: var(--space-md) var(--space-lg);
  border: none;
  background: none;
  color: var(--text-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  text-align: left;
  transition: background-color 0.15s ease;
  box-shadow: none;
  min-height: 44px;

  &:hover {
    background-color: var(--surface-color-light);
  }

  &:focus {
    outline: none;
    background-color: var(--surface-color-light);
  }

  &.danger {
    color: var(--danger-color);
  }
`;

const DropdownUsername = styled.div`
  padding: var(--space-sm) var(--space-lg);
  font-size: var(--font-size-sm);
  color: var(--text-color-light);
  border-bottom: var(--border-width) solid var(--border-color-light);
  font-weight: 500;
`;

export const TabBar = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  username,
  onUserMenuToggle,
  showUserMenu,
  onChangePassword,
  onLogout,
}: TabBarProps) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onUserMenuToggle?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showUserMenu, onUserMenuToggle]);

  // Auto-scroll active tab into view
  useEffect(() => {
    if (!tabsRef.current) return;
    const activeTabEl = tabsRef.current.querySelector(
      `[id="tab-${CSS.escape(activeTabId)}"]`
    ) as HTMLElement | null;
    if (activeTabEl) {
      activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [activeTabId]);

  return (
    <NavContainer aria-label="Navegació principal">
      <TabsWrapper ref={tabsRef} role="tablist">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={tab.id === activeTabId ? 'true' : 'false'}
            aria-controls={`tabpanel-${tab.id}`}
            isActive={tab.id === activeTabId}
            onClick={() => onTabClick(tab.id)}
            title={tab.title}
          >
            {tab.title}
            {tab.isCloseable && (
              <CloseIcon
                type="button"
                onClick={(e: React.MouseEvent) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                title={`Tanca ${tab.title}`}
                aria-label={`Tanca ${tab.title}`}
              >
                ✕
              </CloseIcon>
            )}
          </TabButton>
        ))}
      </TabsWrapper>

      <UserMenuContainer ref={dropdownRef}>
        <UserButton
          onClick={onUserMenuToggle}
          aria-haspopup="true"
          aria-expanded={showUserMenu}
          title="Menú d'usuari"
        >
          👤 {username || 'Usuari'}
        </UserButton>

        {showUserMenu && (
          <Dropdown role="menu">
            <DropdownUsername>{username}</DropdownUsername>
            <DropdownItem role="menuitem" onClick={onChangePassword}>
              🔑 Canviar contrasenya
            </DropdownItem>
            <DropdownItem
              role="menuitem"
              className="danger"
              onClick={onLogout}
            >
              🚪 Tancar sessió
            </DropdownItem>
          </Dropdown>
        )}
      </UserMenuContainer>
    </NavContainer>
  );
};
