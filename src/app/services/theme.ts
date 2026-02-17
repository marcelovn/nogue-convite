import { Injectable, signal } from '@angular/core';
import { CardTheme, ColorScheme } from '../models/card.model';
import { THEMES, COLOR_SCHEMES } from '../models/constants';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  readonly themes = signal<CardTheme[]>(THEMES);
  readonly colorSchemes = signal<ColorScheme[]>(COLOR_SCHEMES);
  readonly selectedTheme = signal<CardTheme>(THEMES[0]);
  readonly selectedColorScheme = signal<ColorScheme>(COLOR_SCHEMES[0]);

  selectTheme(themeId: string): void {
    const theme = THEMES.find(t => t.id === themeId);
    if (theme) {
      this.selectedTheme.set(theme);
      this.applyThemeFont(theme.font);
    }
  }

  selectColorScheme(schemeId: string): void {
    const scheme = COLOR_SCHEMES.find(s => s.id === schemeId);
    if (scheme) {
      this.selectedColorScheme.set(scheme);
      this.applyColorScheme(scheme);
    }
  }

  applyThemeFont(font: string): void {
    document.documentElement.style.setProperty('--theme-font', `'${font}', sans-serif`);
  }

  applyColorScheme(scheme: ColorScheme): void {
    const root = document.documentElement;
    root.style.setProperty('--primary', scheme.primary);
    root.style.setProperty('--secondary', scheme.secondary);
    root.style.setProperty('--accent', scheme.accent);
    root.style.setProperty('--background', scheme.background);
    root.style.setProperty('--text', scheme.text);
  }

  getAvailableThemes(showPremium = true): CardTheme[] {
    return showPremium ? THEMES : THEMES.filter(t => !t.isPremium);
  }
}
