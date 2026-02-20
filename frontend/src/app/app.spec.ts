import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { GlobalErrorService } from './services/global-error.service';
import { signal } from '@angular/core';

describe('AppComponent', () => {
  let themeServiceMock: any; // eslint-disable-line @typescript-eslint/no-explicit-any
  let globalErrorServiceMock: any; // eslint-disable-line @typescript-eslint/no-explicit-any

  beforeEach(async () => {
    themeServiceMock = {
      setMode: () => {},
      getMode: () => 'light'
    };
    globalErrorServiceMock = {
      error: signal(null),
      clear: () => {}
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent, RouterOutlet],
      providers: [
        { provide: ThemeService, useValue: themeServiceMock },
        { provide: GlobalErrorService, useValue: globalErrorServiceMock }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'Jules' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance as any; // eslint-disable-line @typescript-eslint/no-explicit-any
    expect(app.title()).toEqual('Jules');
  });
});
