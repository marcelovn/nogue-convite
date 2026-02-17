import { Component, inject, output } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { CardTheme } from '../../models/card.model';

@Component({
  selector: 'app-theme-selector',
  imports: [],
  templateUrl: './theme-selector.html',
  styleUrl: './theme-selector.scss',
})
export class ThemeSelector {
  private themeService = inject(ThemeService);

  themes = this.themeService.themes;
  selectedTheme = this.themeService.selectedTheme;
  themeChanged = output<CardTheme>();

  selectTheme(theme: CardTheme): void {
    if (!theme.isPremium) {
      this.themeService.selectTheme(theme.id);
      this.themeChanged.emit(theme);
    }
  }
}
