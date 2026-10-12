// src/app/services/language.service.ts
import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLang = signal<'en' | 'ar'>('en');

  constructor() {}

  toggleLang() {
    const newLang = this.currentLang() === 'en' ? 'ar' : 'en';
    this.setLang(newLang);
  }

  setLang(lang: 'en' | 'ar') {
    this.currentLang.set(lang);

    // ✅ ربط Google Translate widget
    const select = document.querySelector<HTMLSelectElement>('.goog-te-combo');
    if (select) {
      select.value = lang;
      select.dispatchEvent(new Event('change'));
    }

    if (lang === 'ar') {
      document.documentElement.dir = 'rtl';
      document.documentElement.lang = 'ar';
    } else {
      document.documentElement.dir = 'ltr';
      document.documentElement.lang = 'en';
    }
  }

  getLang() {
    return this.currentLang();
  }
}
