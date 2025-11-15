import { supabase } from '../../../core/supabase/supabaseClient';
import type { UserBase, PlayerData, GuardianData } from '../schema/userSchema';

export interface Usuario {
  id_usuario: string;
  nombre: string;
  apellido: string;
  correo: string;
  rol: 'admin' | 'jugador' | 'entrenador' | 'apoderado';
  telefono?: string;
  estado_cuenta: boolean;
  fecha_registro: string;
  auth_id?: string;
  jugador?: PlayerData & { id_jugador: string };
  apoderado?: GuardianData & { id_apoderado: string };
}

export interface CreateUserData extends UserBase {
  nuevaPassword: string;
  rut?: string;
  fecha_nacimiento?: Date;
  categoria?: string;
  posicion?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
}

export interface UpdateUserData extends Partial<UserBase> {
  rut?: string;
  fecha_nacimiento?: Date;
  categoria?: string;
  posicion?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
  nuevaPassword?: string;
}

export class UserService {
  static async getAllUsers(): Promise<Usuario[]> {
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('Usuarios')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (usuariosError) throw usuariosError;

    const usuariosConInfo = await Promise.all(
      (usuariosData || []).map(async (usuario) => {
        if (usuario.rol === 'jugador') {
          const { data: jugadorData } = await supabase
            .from('Jugador')
            .select('*')
            .eq('id_jugador', usuario.id_usuario)
            .single();
          return { ...usuario, jugador: jugadorData };
        } else if (usuario.rol === 'apoderado') {
          const { data: apoderadoData } = await supabase
            .from('Apoderado')
            .select('*')
            .eq('id_apoderado', usuario.id_usuario)
            .single();
          return { ...usuario, apoderado: apoderadoData };
        }
        return usuario;
      })
    );

    return usuariosConInfo;
  }

  static async getPlayers(): Promise<Usuario[]> {
    const { data: usuariosData, error: usuariosError } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('rol', 'jugador')
      .order('fecha_registro', { ascending: false });

    if (usuariosError) throw usuariosError;

    const usuariosConInfo = await Promise.all(
      (usuariosData || []).map(async (usuario) => {
        const { data: jugadorData } = await supabase
          .from('Jugador')
          .select('*')
          .eq('id_jugador', usuario.id_usuario)
          .single();
        return { ...usuario, jugador: jugadorData };
      })
    );

    return usuariosConInfo;
  }

  static async createUser(userData: CreateUserData): Promise<Usuario> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.correo,
      password: userData.nuevaPassword,
      options: {
        data: {
          nombre: userData.nombre,
          apellido: userData.apellido,
        }
      }
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('No se pudo crear el usuario');

    const { error: errorUsuario } = await supabase
      .from('Usuarios')
      .insert({
        id_usuario: authData.user.id,
        nombre: userData.nombre,
        apellido: userData.apellido,
        correo: userData.correo,
        telefono: userData.telefono || null,
        rol: userData.rol,
        estado_cuenta: userData.estado_cuenta,
        auth_id: authData.user.id,
      });

    if (errorUsuario) throw errorUsuario;

    // Crear información específica del rol
    if (userData.rol === 'jugador' && userData.rut && userData.fecha_nacimiento) {
      const { error: errorJugador } = await supabase
        .from('Jugador')
        .insert({
          id_jugador: authData.user.id,
          rut: userData.rut,
          fecha_nacimiento: userData.fecha_nacimiento.toISOString().split('T')[0],
          categoria: userData.categoria || null,
          posicion: userData.posicion || null,
        });

      if (errorJugador) throw errorJugador;
    } else if (userData.rol === 'apoderado' && userData.parentesco && userData.id_jugador_tutorado) {
      const { error: errorApoderado } = await supabase
        .from('Apoderado')
        .insert({
          id_apoderado: authData.user.id,
          parentesco: userData.parentesco,
          id_jugador_tutorado: userData.id_jugador_tutorado,
        });

      if (errorApoderado) throw errorApoderado;
    }

    // Return the created user
    const createdUser = await this.getUserById(authData.user.id);
    if (!createdUser) throw new Error('Usuario creado pero no encontrado');
    return createdUser;
  }

  static async updateUser(userId: string, userData: UpdateUserData): Promise<Usuario> {
    // Actualizar usuario
    const updateData: any = {};
    if (userData.nombre) updateData.nombre = userData.nombre;
    if (userData.apellido) updateData.apellido = userData.apellido;
    if (userData.correo) updateData.correo = userData.correo;
    if (userData.telefono !== undefined) updateData.telefono = userData.telefono || null;
    if (userData.rol) updateData.rol = userData.rol;
    if (userData.estado_cuenta !== undefined) updateData.estado_cuenta = userData.estado_cuenta;

    const { error: errorUsuario } = await supabase
      .from('Usuarios')
      .update(updateData)
      .eq('id_usuario', userId);

    if (errorUsuario) throw errorUsuario;

    // Actualizar información específica del rol
    if (userData.rol === 'jugador' && (userData.rut || userData.fecha_nacimiento || userData.categoria || userData.posicion)) {
      const playerUpdate: any = {};
      if (userData.rut) playerUpdate.rut = userData.rut;
      if (userData.fecha_nacimiento) playerUpdate.fecha_nacimiento = userData.fecha_nacimiento.toISOString().split('T')[0];
      if (userData.categoria !== undefined) playerUpdate.categoria = userData.categoria || null;
      if (userData.posicion !== undefined) playerUpdate.posicion = userData.posicion || null;

      const { error: errorJugador } = await supabase
        .from('Jugador')
        .upsert({
          id_jugador: userId,
          ...playerUpdate,
        });

      if (errorJugador) throw errorJugador;
    } else if (userData.rol === 'apoderado' && (userData.parentesco || userData.id_jugador_tutorado)) {
      const guardianUpdate: any = {};
      if (userData.parentesco) guardianUpdate.parentesco = userData.parentesco;
      if (userData.id_jugador_tutorado) guardianUpdate.id_jugador_tutorado = userData.id_jugador_tutorado;

      const { error: errorApoderado } = await supabase
        .from('Apoderado')
        .upsert({
          id_apoderado: userId,
          ...guardianUpdate,
        });

      if (errorApoderado) throw errorApoderado;
    }

    // Actualizar contraseña si se proporciona
    if (userData.nuevaPassword) {
      const { error: errorPassword } = await supabase.auth.updateUser({
        password: userData.nuevaPassword
      });

      if (errorPassword) throw errorPassword;
    }

    // Return the updated user
    const updatedUser = await this.getUserById(userId);
    if (!updatedUser) throw new Error('Usuario actualizado pero no encontrado');
    return updatedUser;
  }

  static async deleteUser(userId: string, user: Usuario): Promise<void> {
    // Eliminar información específica primero
    if (user.rol === 'jugador') {
      await supabase
        .from('Jugador')
        .delete()
        .eq('id_jugador', userId);
    } else if (user.rol === 'apoderado') {
      await supabase
        .from('Apoderado')
        .delete()
        .eq('id_apoderado', userId);
    }

    // Eliminar usuario
    const { error } = await supabase
      .from('Usuarios')
      .delete()
      .eq('id_usuario', userId);

    if (error) throw error;
  }

  static async toggleUserStatus(userId: string, currentStatus: boolean): Promise<void> {
    const { error } = await supabase
      .from('Usuarios')
      .update({ estado_cuenta: !currentStatus })
      .eq('id_usuario', userId);

    if (error) throw error;
  }

  static async getUserById(userId: string): Promise<Usuario | null> {
    const { data: usuarioData, error: usuarioError } = await supabase
      .from('Usuarios')
      .select('*')
      .eq('id_usuario', userId)
      .single();

    if (usuarioError) {
      if (usuarioError.code === 'PGRST116') return null; // Not found
      throw usuarioError;
    }

    if (usuarioData.rol === 'jugador') {
      const { data: jugadorData } = await supabase
        .from('Jugador')
        .select('*')
        .eq('id_jugador', usuarioData.id_usuario)
        .single();
      return { ...usuarioData, jugador: jugadorData };
    } else if (usuarioData.rol === 'apoderado') {
      const { data: apoderadoData } = await supabase
        .from('Apoderado')
        .select('*')
        .eq('id_apoderado', usuarioData.id_usuario)
        .single();
      return { ...usuarioData, apoderado: apoderadoData };
    }

    return usuarioData;
  }
}
