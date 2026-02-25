import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible) {
      <div class="fixed top-4 right-4 z-50 max-w-sm w-full animate-slide-in">
        <div class="rounded-lg shadow-lg p-4 flex items-start gap-3"
             [ngClass]="{
               'bg-green-50 border border-green-200': type === 'success',
               'bg-red-50 border border-red-200': type === 'error',
               'bg-yellow-50 border border-yellow-200': type === 'warning',
               'bg-blue-50 border border-blue-200': type === 'info'
             }">
          @if (type === 'success') {
            <svg class="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          @if (type === 'error') {
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          @if (type === 'warning') {
            <svg class="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
            </svg>
          }
          @if (type === 'info') {
            <svg class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          }
          <div class="flex-1">
            <p class="text-sm font-medium"
               [ngClass]="{
                 'text-green-800': type === 'success',
                 'text-red-800': type === 'error',
                 'text-yellow-800': type === 'warning',
                 'text-blue-800': type === 'info'
               }">
              {{ message }}
            </p>
          </div>
          <button (click)="close.emit()" class="flex-shrink-0"
                  [ngClass]="{
                    'text-green-500 hover:text-green-700': type === 'success',
                    'text-red-500 hover:text-red-700': type === 'error',
                    'text-yellow-500 hover:text-yellow-700': type === 'warning',
                    'text-blue-500 hover:text-blue-700': type === 'info'
                  }">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .animate-slide-in { animation: slideIn 0.3s ease-out; }
  `]
})
export class ToastComponent implements OnChanges, OnDestroy {
  @Input() visible = false;
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'success';
  @Input() duration = 3000;
  @Output() close = new EventEmitter<void>();

  private timer: any;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && this.visible) {
      this.clearTimer();
      if (this.duration > 0) {
        this.timer = setTimeout(() => this.close.emit(), this.duration);
      }
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
