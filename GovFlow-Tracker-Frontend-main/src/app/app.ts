import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar';
import { Footer } from './components/footer/footer';
import { InactivityPopupComponent } from './inactivity-popup/inactivity-popup';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NavbarComponent, Footer, InactivityPopupComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  title = signal('GovFrontend');

  ngOnInit(): void {
    // هذا الكود يضمن أن أي نص عربي يتم عرضه وكتابته من اليمين لليسار
    // دون التأثير على التصميم العام للصفحة الذي يبقى من اليسار لليمين.

    const arabicRegex = /[\u0600-\u06FF]/;

    const hasArabicCharacters = (text: string): boolean => {
      return text ? arabicRegex.test(text) : false;
    };

    // هذه الدالة تطبق تغيير الاتجاه على عناصر نصية محددة فقط
    // لتجنب التأثير على عناصر التصميم الرئيسية.
    const setElementDirection = (element: HTMLElement) => {
      // قائمة بالعناصر التي من الآمن تغيير اتجاه النص بداخلها.
      // تم استبعاد عناصر التصميم مثل DIV, SECTION, FORM.
      const safeTags = ['P', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'SPAN', 'LABEL', 'LI', 'A', 'BUTTON', 'INPUT', 'TEXTAREA', 'TD', 'TH'];

      if (!safeTags.includes(element.tagName)) {
        return; // تجاهل هذا العنصر إذا لم يكن من ضمن العناصر الآمنة
      }

      const text = (element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement)
        ? element.value
        : element.textContent;

      if (hasArabicCharacters(text || '')) {
        // قم بتعيين الاتجاه إلى RTL فقط إذا لم يكن كذلك بالفعل
        if (element.dir !== 'rtl') {
          element.dir = 'rtl';
        }
      } else {
        // أعد الاتجاه إلى LTR إذا لم يكن يحتوي على نص عربي
        if (element.dir !== 'ltr') {
          element.dir = 'ltr';
        }
      }
    };

    // هذا المراقب يتابع أي تغييرات في محتوى الصفحة
    const contentObserver = new MutationObserver((mutationsList) => {
      for (const mutation of mutationsList) {
        // عند إضافة عناصر جديدة
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              setElementDirection(element); // فحص العنصر المضاف
              element.querySelectorAll<HTMLElement>('*').forEach(setElementDirection); // فحص العناصر التي بداخله
            }
          });
        }
        // عند تغيير نص داخل عنصر موجود
        else if (mutation.type === 'characterData') {
          if (mutation.target.parentElement) {
            setElementDirection(mutation.target.parentElement);
          }
        }
      }
    });

    // بدء المراقبة على كامل محتوى الصفحة
    contentObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // معالجة الكتابة المباشرة في الحقول للحصول على استجابة فورية
    document.body.addEventListener('input', (event) => {
      const target = event.target as HTMLElement;
      if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
        setElementDirection(target);
      }
    });

    // تأخير بسيط لضمان تحميل المحتوى الأولي قبل الفحص الأول
    setTimeout(() => {
      document.querySelectorAll<HTMLElement>('body *').forEach(setElementDirection);
    }, 100);
  }
}

