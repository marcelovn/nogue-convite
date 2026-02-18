import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-confirm-dialog',
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialog {
  title   = input<string>('Confirmar');
  message = input<string>('Tem certeza?');
  confirmLabel = input<string>('Confirmar');
  cancelLabel  = input<string>('Cancelar');
  danger  = input<boolean>(true);

  confirmed = output<void>();
  cancelled = output<void>();
}
