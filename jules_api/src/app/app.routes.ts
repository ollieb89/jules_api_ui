import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./jules/dashboard/dashboard.component').then(
        (module) => module.DashboardComponent
      )
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./components/user-list/user-list.component').then(
        (module) => module.UserListComponent
      )
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./components/user-form/user-form.component').then(
        (module) => module.UserFormComponent
      )
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./components/user-form/user-form.component').then(
        (module) => module.UserFormComponent
      )
  },
  {
    path: 'jules',
    loadComponent: () =>
      import('./jules/session-list/session-list.component').then(
        (module) => module.SessionListComponent
      )
  },
  {
    path: 'jules/create',
    loadComponent: () =>
      import('./jules/session-create/session-create.component').then(
        (module) => module.SessionCreateComponent
      )
  },
  {
    path: 'jules/:id',
    loadComponent: () =>
      import('./jules/session-detail/session-detail.component').then(
        (module) => module.SessionDetailComponent
      )
  },
  {
    path: 'jules/settings',
    loadComponent: () =>
      import('./jules/settings/settings.component').then(
        (module) => module.SettingsComponent
      )
  },
  {
    path: 'jules/integrations',
    loadComponent: () =>
      import('./jules/phase-two/phase-two.component').then(
        (module) => module.PhaseTwoComponent
      )
  }
];
