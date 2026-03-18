import { Usuario } from './usuario.model';

export interface Cliente {
  id: number;
  id_usuario: number;
  usuario: Usuario;
}