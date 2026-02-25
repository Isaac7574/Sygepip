import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/50" (click)="onCancel()"></div>
        <div class="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
          <div class="p-6">
            <div class="flex items-center gap-4 mb-4">
              <div class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center"
                   [ngClass]="{
                     'bg-red-100': type === 'danger',
                     'bg-yellow-100': type === 'warning',
                     'bg-blue-100': type === 'info',
                     'bg-green-100': type === 'success'
                   }">
                @if (type === 'danger') {
                  <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                  </svg>
                }
                @if (type === 'warning') {
                  <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
                @if (type === 'info') {
                  <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
                @if (type === 'success') {
                  <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                }
              </div>
              <div>
                <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
                <p class="text-sm text-gray-500 mt-1">{{ message }}</p>
              </div>
            </div>
          </div>
          <div class="flex justify-end gap-3 px-6 py-4 bg-gray-50 rounded-b-xl">
            <button (click)="onCancel()" class="btn-outline">
              {{ cancelText }}
            </button>
            <button (click)="onConfirm()"
                    class="inline-flex items-center px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
                    [ngClass]="{
                      'bg-red-600 hover:bg-red-700': type === 'danger',
                      'bg-yellow-600 hover:bg-yellow-700': type === 'warning',
                      'bg-blue-600 hover:bg-blue-700': type === 'info',
                      'bg-green-600 hover:bg-green-700': type === 'success'
                    }">
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() title = 'Confirmation';
  @Input() message = 'Êtes-vous sûr de vouloir effectuer cette action ?';
  @Input() confirmText = 'Confirmer';
  @Input() cancelText = 'Annuler';
  @Input() type: 'danger' | 'warning' | 'info' | 'success' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
