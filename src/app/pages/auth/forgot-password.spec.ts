import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ForgotPassword } from './forgot-password';
import { AuthService } from '../../services/auth.service';

describe('ForgotPassword', () => {
  let fixture: ComponentFixture<ForgotPassword>;
  let component: ForgotPassword;
  const authServiceMock = {
    requestPasswordReset: vi.fn().mockReturnValue(of({})),
  } as unknown as AuthService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForgotPassword],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPassword);
    component = fixture.componentInstance;
  });

  it('marks the form invalid for bad email', () => {
    component.requestForm.patchValue({ correo: 'correo-invalido' });
    component.requestReset();

    expect(component.requestForm.invalid).toBeTruthy();
    expect(authServiceMock.requestPasswordReset).not.toHaveBeenCalled();
  });

  it('requests reset and navigates when email is valid', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true as never);

    component.requestForm.patchValue({ correo: 'cliente@correo.com' });
    component.requestReset();

    expect(authServiceMock.requestPasswordReset).toHaveBeenCalledWith('cliente@correo.com');
    expect(navigateSpy).toHaveBeenCalledWith(['/restablecer'], { queryParams: { email: 'cliente@correo.com' } });
  });

  it('accepts institutional .edu.pe emails', () => {
    component.requestForm.patchValue({ correo: 'alumno@continental.edu.pe' });
    component.requestReset();

    expect(authServiceMock.requestPasswordReset).toHaveBeenCalledWith('alumno@continental.edu.pe');
  });
});
