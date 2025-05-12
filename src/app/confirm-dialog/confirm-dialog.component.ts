import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

export interface ConfirmDialogData {
  title: string;
  message: string;
  warning?: string;
}

@Component({
  selector: 'app-confirm-dialog',
  template: `
    <div class="p-6">
      <h2 class="text-xl font-bold mb-4 flex items-center">
        <svg class="w-6 h-6 mr-2 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
        </svg>
        {{ data.title }}
      </h2>
      <p class="mb-4 text-gray-700">{{ data.message }}</p>
      <p *ngIf="data.warning" class="mb-4 text-red-500 font-semibold">{{ data.warning }}</p>
      <div class="flex justify-end space-x-4">
        <button
          class="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-gray-700 font-semibold"
          (click)="onCancel()"
          aria-label="Annuler l’action"
        >
          Annuler
        </button>
        <button
          class="px-4 py-2 bg-red-500 rounded-lg hover:bg-red-600 text-white font-semibold"
          (click)="onConfirm()"
          aria-label="Confirmer l’action"
        >
          Confirmer
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class ConfirmDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmDialogData
  ) {}

  onCancel(): void {
    this.dialogRef.close(false);
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }
}