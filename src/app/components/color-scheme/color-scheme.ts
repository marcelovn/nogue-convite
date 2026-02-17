import { Component, inject, output } from '@angular/core';
import { ThemeService } from '../../services/theme';
import { ColorScheme as ColorSchemeModel } from '../../models/card.model';

@Component({
  selector: 'app-color-scheme',
  imports: [],
  templateUrl: './color-scheme.html',
  styleUrl: './color-scheme.scss',
})
export class ColorScheme {
  private themeService = inject(ThemeService);

  colorSchemes = this.themeService.colorSchemes;
  selectedScheme = this.themeService.selectedColorScheme;
  schemeChanged = output<ColorSchemeModel>();

  selectScheme(scheme: ColorSchemeModel): void {
    this.themeService.selectColorScheme(scheme.id);
    this.schemeChanged.emit(scheme);
  }
}
