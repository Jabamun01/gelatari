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
  flex-wrap: wrap;
  align-items: stretch;
  border-bottom: var(--border-width) solid var(--tab-border-color);
  background-color: var(--surface-color);
  padding: 0 var(--space-sm);
  gap: var(--space-xs);
  box-shadow: var(--shadow-sm);
  position: relative;
  min-height: 50px; 
  justify-content: space-between;
`;

const TabsWrapper = styled.div`
  display: flex;
  align-items: stretch;
  gap: var(--space-xs);
  flex: 1;
`;

// Define a dedicated styled component for the close icon (span)
const CloseIcon = styled.span`
  margin-left: var(--space-sm);
  padding: var(--space-xs);
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 1.1em;
  color: var(--text-color-light);
  opacity: 0.6;
  border-radius: 50%;
  width: 20px;
  height: 20px;
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
`;


const TabButton = styled.button<{ isActive: boolean }>`
  padding: 0 var(--space-lg);
  border: none;
  border-bottom: 3px solid transparent;
  background-color: transparent;
  color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color-light)'};
  cursor: pointer;
  font-size: var(--font-size-base);
  font-weight: ${({ isActive }) => isActive ? '600' : '500'};
  border-top-left-radius: var(--border-radius);
  border-top-right-radius: var(--border-radius);
  margin-bottom: -1px;
  position: relative;
  display: inline-flex;
  align-items: center;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;

  ${({ isActive }) => isActive ? `
    border-bottom-color: var(--tab-active-border-color);
    color: var(--primary-color);
  ` : ''}

  &:hover:not(:disabled) {
    background-color: var(--tab-hover-bg);
    color: ${({ isActive }) => isActive ? 'var(--primary-color)' : 'var(--text-color)'};
    border-bottom-color: ${({ isActive }) => isActive ? 'var(--tab-active-border-color)' : 'var(--border-color-light)'};
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 2px var(--primary-color);
    z-index: 1;
  }
`;

const UserMenuContainer = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  padding: 0 var(--space-md);
`;

const UserButton = styled.button`
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: var(--border-width) solid var(--border-color-light);
  border-radius: var(--border-radius);
  background-color: var(--surface-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: var(--font-size-sm);
  font-weight: 500;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    border-color: var(--primary-color);
    background-color: var(--surface-color-light);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--primary-color);
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

  // Close dropdown when clicking outside
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

  return (
    <NavContainer aria-label="Main navigation">
      <TabsWrapper role="tablist">
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            id={`tab-${tab.id}`}
            role="tab"
            aria-selected={tab.id === activeTabId}
            aria-controls={`tabpanel-${tab.id}`}
            isActive={tab.id === activeTabId}
            onClick={() => onTabClick(tab.id)}
            title={tab.title}
          >
            {tab.title}
            {tab.isCloseable && (
            <CloseIcon
              role="button"
              tabIndex={0}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onTabClose(tab.id);
              }}
              onKeyDown={(e: React.KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  e.stopPropagation();
                  onTabClose(tab.id);
                }
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
            <DropdownItem role="menuitem" className="danger" onClick={onLogout}>
              🚪 Tancar sessió
            </DropdownItem>
          </Dropdown>
        )}
      </UserMenuContainer>
    </NavContainer>
  );
};
