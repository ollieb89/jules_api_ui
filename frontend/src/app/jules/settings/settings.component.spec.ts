import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { UserService } from '../../services/user.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('SettingsComponent', () => {
  let component: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let fixture: ComponentFixture<SettingsComponent>;
  let userService: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    userService = {
      getSettings: vi.fn().mockReturnValue(of({
        api_key_configured: true,
        masked_api_key: 'sk_test_...1234',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      })),
      updateApiKey: vi.fn().mockReturnValue(of({ status: 'success' })),
      testConnection: vi.fn().mockReturnValue(of({ status: 'success' }))
    };

    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: UserService, useValue: userService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load settings on init', () => {
    expect(userService.getSettings).toHaveBeenCalled();
    expect(component.apiKeyConfigured()).toBe(true);
  });
});
