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
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font-size: 15px;
  font-weight: 300;
  line-height: 1;
  color: var(--text-color-light);
  opacity: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s ease, background-color 0.15s ease, color 0.15s ease;

  &:hover,
  &:focus-visible {
    opacity: 1 !important;
    background: rgba(220, 53, 69, 0.12);
    color: var(--danger-color);
    outline: none;
  }
`;

const TabTitleSpan = styled.span`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1 1 auto;
  min-width: 0;
`;

const TabButton = styled.button<{ isActive: boolean }>`
  padding: 0 var(--space-md);
  border: none;
  border-right: 1px solid var(--tab-border-color);
  border-bottom: 3px solid ${({ isActive }) =>
    isActive ? 'var(--tab-active-border-color)' : 'transparent'};
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
  justify-content: flex-start;
  white-space: nowrap;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
  min-height: 52px;
  border-radius: 0;
  box-shadow: none;
  touch-action: manipulation;
  flex: 1 1 0;
  min-width: 100px;
  max-width: 220px;

  &:hover:not(:disabled) {
    background-color: var(--tab-hover-bg);
    color: ${({ isActive }) =>
      isActive ? 'var(--primary-color)' : 'var(--text-color)'};
  }

  &:hover:not(:disabled) ${CloseIcon} {
    opacity: 0.5;
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
    min-width: 80px;
    max-width: 150px;
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
            <TabTitleSpan>{tab.title}</TabTitleSpan>
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
                ×
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
