import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSpinnerComponent } from './loading-spinner.component';
import { By } from '@angular/platform-browser';

describe('LoadingSpinnerComponent', () => {
  let component: LoadingSpinnerComponent;
  let fixture: ComponentFixture<LoadingSpinnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSpinnerComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSpinnerComponent);
    component = fixture.componentInstance;
    // Do NOT detect changes here to avoid initial check locking the values
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should have default accessibility attributes', () => {
    fixture.detectChanges();
    const container = fixture.debugElement.query(By.css('div'));
    expect(container.attributes['role']).toBe('status');
    expect(container.attributes['aria-label']).toBe('Loading...');
  });

  it('should apply custom classes', () => {
    component.sizeClass = 'h-12 w-12';
    component.colorClass = 'text-red-500';
    fixture.detectChanges();

    const svg = fixture.debugElement.query(By.css('svg'));
    // Check if the classes are applied.
    // Note: Angular binding might merge classes, so we check for presence.
    const classList = svg.nativeElement.classList;
    expect(classList.contains('h-12')).toBe(true);
    expect(classList.contains('w-12')).toBe(true);
    expect(classList.contains('text-red-500')).toBe(true);
  });
});
