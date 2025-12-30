import { Routes } from '@angular/router';
import { UserListComponent } from './components/user-list/user-list.component';
import { UserFormComponent } from './components/user-form/user-form.component';
import { SessionListComponent } from './jules/session-list/session-list.component';
import { SessionCreateComponent } from './jules/session-create/session-create.component';
import { SessionDetailComponent } from './jules/session-detail/session-detail.component';
import { SettingsComponent } from './jules/settings/settings.component';
import { DashboardComponent } from './jules/dashboard/dashboard.component';
import { PhaseTwoComponent } from './jules/phase-two/phase-two.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    component: DashboardComponent
  },
  {
    path: 'users',
    component: UserListComponent
  },
  {
    path: 'users/new',
    component: UserFormComponent
  },
  {
    path: 'users/:id/edit',
    component: UserFormComponent
  },
  {
    path: 'jules',
    component: SessionListComponent
  },
  {
    path: 'jules/create',
    component: SessionCreateComponent
  },
  {
    path: 'jules/:id',
    component: SessionDetailComponent
  },
  {
    path: 'jules/settings',
    component: SettingsComponent
  },
  {
    path: 'jules/integrations',
    component: PhaseTwoComponent
  }
];
