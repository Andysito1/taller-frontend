import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Recordatorios } from './recordatorios';
import { AdminService } from '../../services/admin.service';

describe('Recordatorios', () => {
  let fixture: ComponentFixture<Recordatorios>;
  let component: Recordatorios;
  const adminServiceMock = {
    getClientes: vi.fn().mockReturnValue(of([
      { id: 1, usuario: { nombre: 'Cliente Demo', correo: 'cliente@correo.com', activo: true } },
    ])),
    getOrdenes: vi.fn().mockReturnValue(of([])),
    sendCustomerReminder: vi.fn().mockReturnValue(of({})),
    sendCompletedService: vi.fn().mockReturnValue(of({})),
  } as unknown as AdminService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Recordatorios],
      providers: [provideRouter([]), { provide: AdminService, useValue: adminServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Recordatorios);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads active clients', () => {
    expect(component.clientes().length).toBe(1);
  });

  it('sends the selected reminder template', () => {
    component.reminderForm.patchValue({ cliente_id: '1', template: 'persuasiva' });
    component.sendReminder();

    expect(adminServiceMock.sendCustomerReminder).toHaveBeenCalledWith(
      1,
      'persuasiva',
      'Los mecánicos extrañan tu auto. ¿No querrás arreglar algo? ¡Ven a Xtreme Performance y deja tu vehículo en manos expertas!'
    );
  });

  it('sends the completed service email for an already finalized order', () => {
    component.sendCompletedService({ id: 99, usuario: { nombre: 'Cliente Demo', correo: 'cliente@correo.com' } } as any);

    expect(adminServiceMock.sendCompletedService).toHaveBeenCalledWith(99);
  });
});
