import { css } from '@linaria/core';

export const globalStyles = css`
  :global() {
    :root {
      /* Color Palette */
      --primary-color: #3B82F6; /* Blue-500 */
      --primary-color-dark: #2563EB; /* Blue-600 */
      --secondary-color: #10B981; /* Emerald-500 */
      --secondary-color-dark: #059669; /* Emerald-600 */
      --background-color: #F3F4F6; /* Gray-100 */
      --surface-color: #FFFFFF; /* White */
      --surface-color-light: #F9FAFB; /* Gray-50 - NEW */
      --border-color: #D1D5DB; /* Gray-300 */
      --border-color-light: #E5E7EB; /* Gray-200 */
      --text-color: #1F2937; /* Gray-800 */
      --text-color-light: #6B7280; /* Gray-500 */
      --text-color-strong: #111827; /* Gray-900 */
      --text-on-primary: #FFFFFF; /* White */
      --text-on-secondary: #FFFFFF; /* White */
      --danger-color: #EF4444; /* Red-500 */
      --danger-color-dark: #DC2626; /* Red-600 */
      --warning-color: #F59E0B; /* Amber-500 */
      --timer-color-red: #EF4444;
      --timer-color-blue: #3B82F6;
      --timer-color-green: #10B981;
      --timer-color-yellow: #F59E0B;
      --timer-color-purple: #8B5CF6;

      /* Typography */
      --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol';
      --font-size-base: 1rem; /* 16px */
      --font-size-sm: 0.875rem; /* 14px */
      --font-size-lg: 1.125rem; /* 18px */
      --line-height-base: 1.5;
      --line-height-tight: 1.25;

      /* Spacing */
      --spacing-unit: 8px;
      --space-xs: calc(var(--spacing-unit) * 0.5);  /* 4px */
      --space-sm: var(--spacing-unit);             /* 8px */
      --space-md: calc(var(--spacing-unit) * 1.5);  /* 12px */
      --space-lg: calc(var(--spacing-unit) * 2);    /* 16px */
      --space-xl: calc(var(--spacing-unit) * 3);    /* 24px */
      --space-2xl: calc(var(--spacing-unit) * 4);   /* 32px */

      /* Borders */
      --border-radius: 6px;
      --border-radius-lg: 8px;
      --border-width: 1px;

      /* Shadows */
      --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
      --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
      --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);

      /* Inputs & Buttons */
      --input-bg: var(--surface-color);
      --button-bg: var(--surface-color);
      --button-text: var(--text-color);
      --button-hover-bg: var(--background-color);
      --button-text-primary: var(--text-on-primary);
      --button-text-secondary: var(--text-on-secondary);

      /* Tabs */
      --tab-active-bg: var(--surface-color);
      --tab-inactive-bg: transparent; /* Make inactive tabs blend more */
      --tab-hover-bg: var(--background-color);
      --tab-border-color: var(--border-color);
      --tab-active-border-color: var(--primary-color);
    }

    /* Apply Inter font if available */
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
    h1 { font-size: 2.25rem; } /* 36px */
    h2 { font-size: 1.875rem; } /* 30px */
    h3 { font-size: 1.5rem; } /* 24px */
    h4 { font-size: 1.25rem; } /* 20px */

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

    /* Basic form element styling */
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
        box-shadow: var(--shadow-sm);
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
        -moz-appearance: textfield;
        -webkit-appearance: textfield;
        appearance: textfield;
        /* width: 100%; Default to full width */
    }

    input:focus,
    select:focus,
    textarea:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Focus ring using primary color */
    }

    button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-sm) var(--space-lg);
        border: var(--border-width) solid transparent;
        border-radius: var(--border-radius);
        font-weight: 500;
        cursor: pointer;
        transition: background-color 0.2s ease, border-color 0.2s ease, color 0.2s ease, box-shadow 0.2s ease;
        box-shadow: var(--shadow-sm);
        background-color: var(--button-bg);
        color: var(--button-text);
    }

    button:hover:not(:disabled) {
        background-color: var(--button-hover-bg);
    }

    button:focus {
        outline: none;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3); /* Focus ring */
    }

    button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    /* Utility classes (optional, but can be helpful) */
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