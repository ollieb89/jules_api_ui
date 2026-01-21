import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConfirmationDialogComponent } from './confirmation-dialog.component';
import { By } from '@angular/platform-browser';
import { vi, describe, it, expect, beforeAll, beforeEach } from 'vitest';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeAll(() => {
    // Polyfill for JSDOM
    if (!HTMLDialogElement.prototype.showModal) {
      HTMLDialogElement.prototype.showModal = function() {
        this.setAttribute('open', '');
      };
    }
    if (!HTMLDialogElement.prototype.close) {
      HTMLDialogElement.prototype.close = function() {
        this.removeAttribute('open');
      };
    }
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationDialogComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close when clicking on the backdrop', () => {
    const closeSpy = vi.spyOn(component, 'close');
    const dialogDebugElement = fixture.debugElement.query(By.css('dialog'));
    const dialogElement = dialogDebugElement.nativeElement;

    // Dispatch a click event directly on the dialog element (representing backdrop click)
    const event = new MouseEvent('click', {
      bubbles: true,
      cancelable: true
      // view: window - Removed to avoid JSDOM/Vitest issue
    });

    dialogElement.dispatchEvent(event);
    fixture.detectChanges();

    expect(closeSpy).toHaveBeenCalled();
  });

  it('should NOT close when clicking on the content', () => {
    const closeSpy = vi.spyOn(component, 'close');
    const contentDebugElement = fixture.debugElement.query(By.css('.p-6')); // The inner div
    const contentElement = contentDebugElement.nativeElement;

    contentElement.click();
    fixture.detectChanges();

    expect(closeSpy).not.toHaveBeenCalled();
  });
});
