/* eslint-disable @typescript-eslint/no-explicit-any */
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionCreateComponent } from './session-create.component';
import { JulesService } from '../../services/jules.service';
import { SourceService } from '../../services/source.service';
import { of } from 'rxjs';
import { vi } from 'vitest';

describe('SessionCreateComponent', () => {
  let component: SessionCreateComponent;
  let fixture: ComponentFixture<SessionCreateComponent>;
  let julesService: any;
  let sourceService: any;
  let router: any;

  beforeEach(async () => {
    julesService = {
      createSession: vi.fn().mockReturnValue(of({ name: 'sessions/1' }))
    };
    sourceService = {
      getSources: vi.fn().mockReturnValue(of({ sources: [] }))
    };
    router = {
      navigate: vi.fn()
    };

    await TestBed.configureTestingModule({
      imports: [SessionCreateComponent],
      providers: [
        { provide: JulesService, useValue: julesService },
        { provide: SourceService, useValue: sourceService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SessionCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
