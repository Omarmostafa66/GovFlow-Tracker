import { Routes } from '@angular/router';
import { roleGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';
import { AgeGuard } from './guards/age.guard';

// Public Components
import { HomeComponent } from './pages/home/home';
import { HelpComponent } from './pages/help/help';
import { LoginComponent } from './pages/login/login';
import { RegisterComponent } from './pages/register/register';
import { ForgotPasswordComponent } from './pages/forgot-password/forgot-password';
import { ResetPasswordComponent } from './pages/reset-password/reset-password';

// Shared Authenticated Components
import { ProfileComponent } from './pages/profile/profile';
import { NotificationsComponent } from './pages/notifications/notifications';

// Citizen Components
import { CitizenDashboardComponent } from './pages/citizen-dashboard/citizen-dashboard';
import { MyRequestsComponent } from './pages/citizen-dashboard/my-requests/my-requests.component';
import { RequestDetailsComponent } from './pages/citizen-dashboard/my-requests/request-details/request-details.component';
import { PaymentsComponent } from './pages/citizen-dashboard/payments/payments.component';
import { PaymentHistoryComponent } from './pages/citizen-dashboard/payment-history/payment-history';
import { TrafficServicesComponent } from './pages/citizen-dashboard/traffic-services/traffic-services';
import { MunicipalityServicesComponent } from './pages/citizen-dashboard/municipality-services/municipality-services';
import { DriversLicenseIssuanceComponent } from './pages/citizen-dashboard/traffic-services/services/drivers-license-issuance/drivers-license-issuance';
import { LicenseRenewalComponent } from './pages/citizen-dashboard/traffic-services/services/license-renewal/license-renewal';
import { LicenseReplacementComponent } from './pages/citizen-dashboard/traffic-services/services/license-replacement/license-replacement';
import { TrafficViolationsComponent } from './pages/citizen-dashboard/traffic-services/services/traffic-violations/traffic-violations';
import { VehicleRegistrationComponent } from './pages/citizen-dashboard/traffic-services/services/vehicle-registration/vehicle-registration';
import { BuildingPermitComponent } from './pages/citizen-dashboard/municipality-services/services/building-permit/building-permit';
import { BuildingPermitRenewalComponent } from './pages/citizen-dashboard/municipality-services/services/building-permit-renewal/building-permit-renewal';
import { CleanlinessComplaintComponent } from './pages/citizen-dashboard/municipality-services/services/cleanliness-complaint/cleanliness-complaint';
import { RenovationPermitComponent } from './pages/citizen-dashboard/municipality-services/services/renovation-permit/renovation-permit';
import { BuildingViolationComplaintComponent } from './pages/citizen-dashboard/municipality-services/services/building-violation-complaint/building-violation-complaint';

// Employee Components
import { EmployeeDashboardComponent } from './pages/employee-dashboard/employee-dashboard';
import { MyTasksComponent } from './pages/employee-dashboard/employee-tasks/employee-tasks';

// Manager Components
import { ManagerDashboardComponent } from './pages/manager-dashboard/manager-dashboard.component';
import { ReportsDashboardComponent } from './pages/manager-dashboard/reports-dashboard/reports-dashboard.component';
import { EmployeeManagementComponent } from './pages/employee-management/employee-management.component';


export const routes: Routes = [
  { path: '', component: HomeComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'help', component: HelpComponent },
  { path: 'login', component: LoginComponent, canActivate: [guestGuard] },
  { path: 'register', component: RegisterComponent, canActivate: [guestGuard] },
  { path: 'forgot-password', component: ForgotPasswordComponent, canActivate: [guestGuard] },
  { path: 'reset-password', component: ResetPasswordComponent, canActivate: [guestGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'notifications', component: NotificationsComponent, canActivate: [authGuard] },
  { path: 'citizen-dashboard', component: CitizenDashboardComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'my-requests', component: MyRequestsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'my-requests/:id', component: RequestDetailsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'payments', component: PaymentsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'payments/:id', component: PaymentsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'payments/:preselectId', component: PaymentsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'payment-history', component: PaymentHistoryComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services', component: TrafficServicesComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'municipality-services', component: MunicipalityServicesComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services/issue-license', component: DriversLicenseIssuanceComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services/renew-license', component: LicenseRenewalComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services/replace-license', component: LicenseReplacementComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services/traffic-violations', component: TrafficViolationsComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'traffic-services/vehicle-registration', component: VehicleRegistrationComponent, canActivate: [roleGuard], data: { expectedRole: 'CITIZEN' } },

  // MODIFICATION: Added AgeGuard to all municipality service routes
  { path: 'municipality-services/building-permit', component: BuildingPermitComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'municipality-services/building-permit-renewal', component: BuildingPermitRenewalComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'municipality-services/building-violation-complaint', component: BuildingViolationComplaintComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'municipality-services/cleanliness-complaint', component: CleanlinessComplaintComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },
  { path: 'municipality-services/renovation-permit', component: RenovationPermitComponent, canActivate: [roleGuard, AgeGuard], data: { expectedRole: 'CITIZEN' } },

  { path: 'employee-dashboard', component: EmployeeDashboardComponent, canActivate: [roleGuard], data: { expectedRole: 'EMPLOYEE' } },
  { path: 'employee-tasks', component: MyTasksComponent, canActivate: [roleGuard], data: { expectedRole: 'EMPLOYEE' } },
  { path: 'manager-dashboard', component: ManagerDashboardComponent, canActivate: [roleGuard], data: { expectedRole: 'MANAGER' } },
  { path: 'employees', component: EmployeeManagementComponent, canActivate: [roleGuard], data: { expectedRole: 'MANAGER' } },
  { path: 'reports', component: ReportsDashboardComponent, canActivate: [roleGuard], data: { expectedRole: 'MANAGER' } },
  { path: '**', redirectTo: '' }
];
