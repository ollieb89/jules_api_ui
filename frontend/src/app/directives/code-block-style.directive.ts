import { Directive, AfterViewInit, ElementRef, Renderer2, OnDestroy, inject } from '@angular/core';
import { ClipboardService } from '../services/clipboard.service';

/**
 * Directive to fix code block styling by removing problematic inline styles
 * that might be applied by syntax highlighters or other libraries.
 * This directive watches for dynamically created code elements.
 */
@Directive({
  selector: 'markdown',
  standalone: true
})
export class CodeBlockStyleDirective implements AfterViewInit, OnDestroy {
  private observer?: MutationObserver;
  private clipboardService = inject(ClipboardService);

  constructor(
    private el: ElementRef<HTMLElement>,
    private renderer: Renderer2
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
      subtree: true
    });
  }

  ngOnDestroy(): void {
    if (this.observer) {
      this.observer.disconnect();
    }
  }

  private fixCodeElements(): void {
    const codeElements = this.el.nativeElement.querySelectorAll('pre code, code[class*="language-"]');
    
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
        'margin-right'
      ];

      stylesToRemove.forEach(style => {
        if (htmlElement.style.getPropertyValue(style)) {
          this.renderer.removeStyle(htmlElement, style);
        }
      });

      // Ensure proper display for code inside pre
      if (htmlElement.parentElement?.tagName === 'PRE') {
        const preElement = htmlElement.parentElement;
        this.renderer.setStyle(htmlElement, 'display', 'block');
        this.renderer.setStyle(htmlElement, 'text-align', 'left');

        // Add Copy Button if not already present
        if (!preElement.hasAttribute('data-copy-button-added')) {
          this.renderer.setAttribute(preElement, 'data-copy-button-added', 'true');

          // Add relative positioning and group class for hover effect
          this.renderer.addClass(preElement, 'relative');
          this.renderer.addClass(preElement, 'group');

          // Create button
          const button = this.renderer.createElement('button');
          this.renderer.setAttribute(button, 'type', 'button');
          this.renderer.setAttribute(button, 'aria-label', 'Copy code to clipboard');
          this.renderer.setAttribute(button, 'title', 'Copy code');

          // Apply classes (hidden by default, shown on group hover)
          const buttonClasses = [
            'absolute', 'top-2', 'right-2',
            'z-10', // Ensure it stays on top
            'px-2', 'py-1',
            'bg-[var(--color-background-tertiary)]',
            'hover:bg-[var(--color-background-secondary)]',
            'text-[var(--color-text-primary)]',
            'text-xs', 'font-medium', 'rounded',
            'transition-all',
            'focus-visible:outline-none',
            'focus-visible:ring-2',
            'focus-visible:ring-[var(--color-focus-ring)]',
            'focus-visible:ring-offset-2',
            'focus-visible:ring-offset-[var(--color-focus-ring-offset)]',
            'opacity-0',
            'group-hover:opacity-100',
            'focus-visible:opacity-100' // Ensure visible on focus
          ];

          buttonClasses.forEach(cls => this.renderer.addClass(button, cls));

          // Set initial text
          const textNode = this.renderer.createText('📋 Copy');
          this.renderer.appendChild(button, textNode);

          // Add click listener
          this.renderer.listen(button, 'click', () => {
            const codeText = htmlElement.textContent || '';
            this.clipboardService.copyToClipboard(codeText).then(success => {
              if (success) {
                // Show success state
                this.renderer.setProperty(button, 'textContent', '✓ Copied!');
                this.renderer.addClass(button, 'text-[var(--color-text-success)]');
                this.renderer.removeClass(button, 'text-[var(--color-text-primary)]');

                setTimeout(() => {
                  this.renderer.setProperty(button, 'textContent', '📋 Copy');
                  this.renderer.removeClass(button, 'text-[var(--color-text-success)]');
                  this.renderer.addClass(button, 'text-[var(--color-text-primary)]');
                }, 2000);
              }
            });
          });

          this.renderer.appendChild(preElement, button);
        }
      }
    });
  }
}
