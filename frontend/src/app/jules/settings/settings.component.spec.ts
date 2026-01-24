import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SettingsComponent } from './settings.component';
import { JulesService } from '../../services/jules.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { provideRouter } from '@angular/router';

describe('SettingsComponent', () => {
  let component: SettingsComponent;
  let fixture: ComponentFixture<SettingsComponent>;
  let julesService: any;

  beforeEach(async () => {
    julesService = {
      getSettings: vi.fn(),
      updateApiKey: vi.fn(),
      testConnection: vi.fn()
    };

    julesService.getSettings.mockReturnValue(
      of({
        api_key_configured: true,
        masked_api_key: '****1234',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      })
    );



    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [
        { provide: JulesService, useValue: julesService },
        provideRouter([])
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    component = fixture.componentInstance;
  });

  it('should load settings on init', () => {
    fixture.detectChanges();

    expect(julesService.getSettings).toHaveBeenCalled();
    expect(component.settings()?.api_key_configured).toBe(true);
    expect(component.connectionStatus()).toBe('unknown');
  });

  it('should save the API key and refresh settings', () => {
    julesService.updateApiKey.mockReturnValue(of({ status: 'success', message: 'Saved' }));

    fixture.detectChanges();

    component.apiKeyForm.setValue({ apiKey: 'abc123' });
    component.saveApiKey();

    expect(julesService.updateApiKey).toHaveBeenCalledWith('abc123');
    expect(julesService.getSettings).toHaveBeenCalledTimes(2);
    expect(component.successMessage()).toBe('Saved');
  });

  it('should update connection status on successful test connection', () => {
    julesService.testConnection.mockReturnValue(
      of({
        status: 'success',
        message: 'Connection ok',
        api_key_configured: true,
        api_connectivity: 'ok',
        sources_count: 2
      })
    );

    fixture.detectChanges();

    component.testConnection();

    expect(julesService.testConnection).toHaveBeenCalled();
    expect(component.connectionStatus()).toBe('connected');
    expect(component.successMessage()).toBe('Connection ok');
  });

  it('should surface errors on failed connection tests', () => {
    julesService.testConnection.mockReturnValue(
      of({
        status: 'error',
        message: 'Connection failed',
        api_key_configured: true,
        api_connectivity: 'error',
        sources_count: 0
      })
    );

    fixture.detectChanges();

    component.testConnection();

    expect(component.connectionStatus()).toBe('error');
    expect(component.error()).toBe('Connection failed');
  });

  it('should toggle API key visibility', () => {
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('#api-key');

    expect(component.showApiKey()).toBe(false);
    expect(input.type).toBe('password');

    component.toggleApiKeyVisibility();
    fixture.detectChanges();

    expect(component.showApiKey()).toBe(true);
    expect(input.type).toBe('text');

    component.toggleApiKeyVisibility();
    fixture.detectChanges();

    expect(component.showApiKey()).toBe(false);
    expect(input.type).toBe('password');
  });
});
