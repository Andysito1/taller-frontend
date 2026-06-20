import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ResetPasswordComponent } from './reset-password';
import { AuthService } from '../../services/auth.service';

describe('ResetPasswordComponent', () => {
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let component: ResetPasswordComponent;
  const authServiceMock = {
    resetPassword: vi.fn().mockReturnValue(of({})),
    userRole: vi.fn().mockReturnValue('CLIENTE'),
  } as unknown as AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: (key: string) => ({ email: 'cliente@correo.com', code: '123456' }[key] ?? null) } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('detects password mismatch', () => {
    component.resetForm.patchValue({
      password: '12345678',
      password_confirmation: '87654321',
    });

    component.submit();

    expect(component.resetForm.hasError('mismatch')).toBeTruthy();
    expect(authServiceMock.resetPassword).not.toHaveBeenCalled();
  });

  it('submits payload when form is valid', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as never);

    component.resetForm.patchValue({
      password: '12345678',
      password_confirmation: '12345678',
    });

    component.submit();

    expect(authServiceMock.resetPassword).toHaveBeenCalledWith({
      correo: 'cliente@correo.com',
      email: 'cliente@correo.com',
      codigo: '123456',
      code: '123456',
      token: '123456',
      password: '12345678',
      password_confirmation: '12345678',
    });
    expect(navigateSpy).toHaveBeenCalledWith(['/cliente']);
  });
});
