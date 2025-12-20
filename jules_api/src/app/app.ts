import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('jules_api');
  private readonly themeService = inject(ThemeService);
  
  ngOnInit(): void {
    // Initialize theme on app startup
    this.themeService.setMode(this.themeService.getMode());
  }
}
