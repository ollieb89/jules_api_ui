import { Directive, AfterViewInit, ElementRef, Renderer2, OnDestroy } from '@angular/core';

/**
 * Directive to fix code block styling by removing problematic inline styles
 * that might be applied by syntax highlighters or other libraries.
 * This directive watches for dynamically created code elements.
 */
@Directive({
  selector: 'markdown',
  standalone: true,
})
export class CodeBlockStyleDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    // Fix existing code elements
    this.fixCodeElements();

    // Watch for dynamically added code elements (from markdown rendering)
    this.observer = new MutationObserver(() => {
      this.fixCodeElements();
    });

    this.observer.observe(this.el.nativeElement, {
      childList: true,
      subtree: true,
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private fixCodeElements(): void {
    const codeElements = this.el.nativeElement.querySelectorAll(
      'pre code, code[class*="language-"]',
    );

    codeElements.forEach((element) => {
      const htmlElement = element as HTMLElement;

      // Remove problematic inline styles
      const stylesToRemove = [
        'display',
        'flex-direction',
        'flex-flow',
        'grid-template-columns',
        'grid-template-rows',
        'grid-auto-flow',
        'border',
        'border-width',
        'border-style',
        'border-color',
        'padding',
        'padding-top',
        'padding-bottom',
        'padding-left',
        'padding-right',
        'margin',
        'margin-top',
        'margin-bottom',
        'margin-left',
        'margin-right',
      ];

      stylesToRemove.forEach((style) => {
        if (htmlElement.style.getPropertyValue(style)) {
          this.renderer.removeStyle(htmlElement, style);
        }
      });

      // Ensure proper display for code inside pre
      if (htmlElement.parentElement?.tagName === 'PRE') {
        this.renderer.setStyle(htmlElement, 'display', 'block');
        this.renderer.setStyle(htmlElement, 'text-align', 'left');
      }
    });
  }
}
