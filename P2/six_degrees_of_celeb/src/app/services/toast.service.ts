import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  ttlMs: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts$ = new BehaviorSubject<ToastMessage[]>([]);
  readonly toasts$ = this._toasts$.asObservable();

  show(message: string, opts?: Partial<Omit<ToastMessage, 'id' | 'message'>>): void {
    const toast: ToastMessage = {
      id: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
      type: opts?.type ?? 'info',
      title: opts?.title,
      message,
      ttlMs: opts?.ttlMs ?? 3500,
    };

    this._toasts$.next([toast, ...this._toasts$.value]);

    window.setTimeout(() => this.dismiss(toast.id), toast.ttlMs);
  }

  dismiss(id: string): void {
    this._toasts$.next(this._toasts$.value.filter((t) => t.id !== id));
  }

  clear(): void {
    this._toasts$.next([]);
  }
}

