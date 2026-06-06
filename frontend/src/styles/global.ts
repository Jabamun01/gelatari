import { css } from '@linaria/core';

export const globalStyles = css`
  :global() {
    :root {
      /* ===== Color Palette ===== */
      --primary-color: #3B82F6;
      --primary-color-dark: #2563EB;
      --primary-color-light: #93C5FD;
      --primary-color-xlight: #DBEAFE;

      --secondary-color: #10B981;
      --secondary-color-dark: #059669;

      --background-color: #F3F4F6;
      --surface-color: #FFFFFF;
      --surface-color-light: #F9FAFB;
      --surface-color-raised: #FFFFFF;
      --surface-color-hover: #F3F4F6;

      --border-color: #D1D5DB;
      --border-color-light: #E5E7EB;
      --border-color-hover: #9CA3AF;

      --text-color: #1F2937;
      --text-color-light: #6B7280;
      --text-color-lighter: #9CA3AF;
      --text-color-strong: #111827;
      --text-on-primary: #FFFFFF;
      --text-on-secondary: #FFFFFF;
      --text-on-disabled: #9CA3AF;

      --danger-color: #EF4444;
      --danger-color-dark: #B91C1C;
      --danger-color-light: #FEE2E2;

      --warning-color: #F59E0B;
      --warning-color-dark: #D97706;
      --warning-color-light: #FEF3C7;

      --success-color: #10B981;
      --success-color-dark: #059669;
      --success-color-light: #D1FAE5;

      --timer-color-red: #EF4444;
      --timer-color-blue: #3B82F6;
      --timer-color-green: #10B981;
      --timer-color-yellow: #F59E0B;
      --timer-color-purple: #8B5CF6;

      /* ===== Typography ===== */
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
        Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
      --font-size-xs: 0.75rem;
      --font-size-sm: 0.875rem;
      --font-size-base: 1rem;
      --font-size-md: 1rem;
      --font-size-lg: 1.125rem;
      --font-size-xl: 1.25rem;
      --line-height-base: 1.5;
      --line-height-tight: 1.25;

      /* ===== Spacing (8px unit) ===== */
      --spacing-unit: 8px;
      --space-xs: calc(var(--spacing-unit) * 0.5); /* 4px */
      --space-sm: var(--spacing-unit);             /* 8px */
      --space-md: calc(var(--spacing-unit) * 1.5); /* 12px */
      --space-lg: calc(var(--spacing-unit) * 2);   /* 16px */
      --space-xl: calc(var(--spacing-unit) * 3);   /* 24px */
      --space-2xl: calc(var(--spacing-unit) * 4);  /* 32px */

      /* ===== Borders ===== */
      --border-width: 1px;
      --border-radius-sm: 4px;
      --border-radius: 6px;
      --border-radius-lg: 8px;
      --border-radius-xl: 12px;

      /* ===== Shadows ===== */
      --shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03);
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
      --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);

      /* ===== Focus ===== */
      --focus-ring-color: rgba(59, 130, 246, 0.35);
      --focus-ring-danger: rgba(239, 68, 68, 0.35);

      /* ===== Inputs & Buttons ===== */
      --input-bg: var(--surface-color);
      --button-bg: var(--surface-color);
      --button-text: var(--text-color);
      --button-hover-bg: var(--background-color);
      --button-text-primary: var(--text-on-primary);
      --button-text-secondary: var(--text-on-secondary);

      /* ===== Disabled ===== */
      --disabled-color: #E5E7EB;
      --disabled-color-strong: #D1D5DB;

      /* ===== Tabs ===== */
      --tab-active-bg: var(--surface-color);
      --tab-inactive-bg: transparent;
      --tab-hover-bg: var(--background-color);
      --tab-border-color: var(--border-color);
      --tab-active-border-color: var(--primary-color);

      /* Interactive states */
      --surface-color-hover: #F3F4F6;
      --border-color-hover: #9CA3AF;
      --focus-ring-color: rgba(59, 130, 246, 0.25);
    }

    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    body {
      margin: 0;
      font-family: var(--font-family);
      font-size: var(--font-size-base);
      background-color: var(--background-color);
      color: var(--text-color);
      line-height: var(--line-height-base);
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    * {
      box-sizing: border-box;
    }

    h1, h2, h3, h4, h5, h6 {
      margin-top: 0;
      margin-bottom: var(--space-md);
      font-weight: 600;
      color: var(--text-color-strong);
      line-height: var(--line-height-tight);
    }

    h1 { font-size: 2.25rem; }
    h2 { font-size: 1.875rem; }
    h3 { font-size: 1.5rem; }
    h4 { font-size: 1.25rem; }

    p {
      margin-top: 0;
      margin-bottom: var(--space-lg);
    }

    a {
      color: var(--primary-color);
      text-decoration: none;
      transition: color 0.2s ease;
    }

    a:hover {
      color: var(--primary-color-dark);
      text-decoration: underline;
    }

    /* ===== Form Elements ===== */
    input, select, textarea, button {
      font-family: inherit;
      font-size: inherit;
      line-height: inherit;
      color: inherit;
    }

    input[type="text"],
    input[type="search"],
    input[type="number"],
    input[type="email"],
    input[type="password"],
    textarea,
    select {
      padding: var(--space-sm) var(--space-md);
      border: var(--border-width) solid var(--border-color);
      border-radius: var(--border-radius);
      background-color: var(--input-bg);
      box-shadow: var(--shadow-xs);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      -moz-appearance: textfield;
      -webkit-appearance: textfield;
      appearance: textfield;
    }

    input:focus,
    select:focus,
    textarea:focus {
      outline: none;
      border-color: var(--primary-color);
      box-shadow: 0 0 0 3px var(--focus-ring-color);
    }

    /* ===== Base Button ===== */
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-sm) var(--space-lg);
      border: var(--border-width) solid transparent;
      border-radius: var(--border-radius);
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s ease, border-color 0.2s ease,
        color 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
      box-shadow: var(--shadow-xs);
      background-color: var(--button-bg);
      color: var(--button-text);
      min-height: 44px;
      touch-action: manipulation;
      user-select: none;
      -webkit-user-select: none;
    }

    button:hover:not(:disabled) {
      background-color: var(--button-hover-bg);
    }

    button:active:not(:disabled) {
      transform: scale(0.97);
    }

    button:focus {
      outline: none;
      box-shadow: 0 0 0 3px var(--focus-ring-color);
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    /* ===== Scrollbar Styling ===== */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background-color: var(--border-color);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background-color: var(--border-color-hover);
    }

    /* ===== Utility Classes ===== */
    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  }
`;
