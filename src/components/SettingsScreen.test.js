import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { version } from '../../package.json';
import { SettingsScreen } from './SettingsScreen.jsx';

describe('SettingsScreen', () => {
  it('shows the current application version', () => {
    const markup = renderToStaticMarkup(
      createElement(SettingsScreen, {
        t: {},
        languageOptions: [],
        currencyOptions: [],
        numberFormat: { thousands: false, decimals: 0 },
        thousandsToggle: [],
        decimalsOptions: []
      })
    );

    expect(markup).toContain(`Coin Book · v${version}`);
  });
});
