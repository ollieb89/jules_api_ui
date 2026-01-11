import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';
import { GlobalErrorService } from './services/global-error.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App implements OnInit {
  protected readonly title = signal('Jules');
  private readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);
  private readonly globalErrorService = inject(GlobalErrorService);

  protected readonly errorState = this.globalErrorService.error;

  ngOnInit(): void {
    // Initialize theme on app startup
    this.themeService.setMode(this.themeService.getMode());
  }

  protected handleRecovery(): void {
    this.globalErrorService.clear();
    void this.router.navigateByUrl('/');
  }
}
