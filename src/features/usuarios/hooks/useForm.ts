import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { UserService, Usuario, CreateUserData, UpdateUserData } from '../services/userService';

export interface FormularioUsuario {
  nombre: string;
  apellido: string;
  correo: string;
  telefono: string;
  rol: string;
  estado_cuenta: boolean;
  rut?: string;
  fecha_nacimiento?: Date;
  categoria?: string;
  posicion?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
  nuevaPassword?: string;
  confirmarPassword?: string;
}

export interface ErroresFormulario {
  nombre?: string;
  apellido?: string;
  correo?: string;
  telefono?: string;
  rut?: string;
  parentesco?: string;
  id_jugador_tutorado?: string;
  nuevaPassword?: string;
  confirmarPassword?: string;
  general?: string;
}

export interface UseFormReturn {
  formulario: FormularioUsuario;
  setFormulario: (form: FormularioUsuario) => void;
  errores: ErroresFormulario;
  guardando: boolean;
  modalVisible: boolean;
  modalNuevoUsuario: boolean;
  usuarioSeleccionado: Usuario | null;
  editando: boolean;
  mostrarDatePicker: boolean;
  setMostrarDatePicker: (show: boolean) => void;
  validarFormulario: () => boolean;
  guardarUsuario: () => Promise<void>;
  abrirModalEdicion: (usuario: Usuario) => void;
  abrirModalNuevoUsuario: () => void;
  cerrarModal: () => void;
  limpiarErrores: () => void;
  onRefreshUsuarios: () => void;
}

export function useForm(onRefreshUsuarios: () => void): UseFormReturn {
  const [formulario, setFormulario] = useState<FormularioUsuario>({
    nombre: '',
    apellido: '',
    correo: '',
    telefono: '',
    rol: 'jugador',
    estado_cuenta: true,
    rut: '',
    fecha_nacimiento: new Date(),
    categoria: '',
    posicion: '',
    parentesco: '',
    nuevaPassword: '',
    confirmarPassword: '',
  });

  const [errores, setErrores] = useState<ErroresFormulario>({});
  const [guardando, setGuardando] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalNuevoUsuario, setModalNuevoUsuario] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<Usuario | null>(null);
  const [editando, setEditando] = useState(false);
  const [mostrarDatePicker, setMostrarDatePicker] = useState(false);

  const validarFormulario = useCallback((): boolean => {
    const nuevosErrores: ErroresFormulario = {};

    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formulario.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formulario.apellido.trim()) {
      nuevosErrores.apellido = 'El apellido es obligatorio';
    } else if (formulario.apellido.trim().length < 2) {
      nuevosErrores.apellido = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!formulario.correo.trim()) {
      nuevosErrores.correo = 'El correo es obligatorio';
    } else if (!/^\S+@\S+\.\S+$/.test(formulario.correo)) {
      nuevosErrores.correo = 'El formato del correo no es válido';
    }

    if (formulario.telefono && !/^[\+]?[0-9\s\-\(\)]{8,}$/.test(formulario.telefono)) {
      nuevosErrores.telefono = 'El formato del teléfono no es válido';
    }

    if (formulario.rol === 'jugador') {
      if (!formulario.rut?.trim()) {
        nuevosErrores.rut = 'El RUT es obligatorio para jugadores';
      } else if (!/^[0-9]{7,8}-[0-9kK]{1}$/.test(formulario.rut)) {
        nuevosErrores.rut = 'El formato del RUT no es válido (12345678-9)';
      }
    }

    if (formulario.rol === 'apoderado') {
      if (!formulario.parentesco?.trim()) {
        nuevosErrores.parentesco = 'El parentesco es obligatorio para apoderados';
      }
      if (!formulario.id_jugador_tutorado) {
        nuevosErrores.id_jugador_tutorado = 'Debe seleccionar un jugador tutorado';
      }
    }

    if (!editando && !formulario.nuevaPassword) {
      nuevosErrores.nuevaPassword = 'La contraseña es obligatoria para nuevos usuarios';
    } else if (formulario.nuevaPassword && formulario.nuevaPassword.length < 6) {
      nuevosErrores.nuevaPassword = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (formulario.nuevaPassword !== formulario.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }, [formulario, editando]);

  const guardarUsuario = useCallback(async () => {
    if (!validarFormulario()) {
      Alert.alert('Error', 'Por favor corrige los errores en el formulario');
      return;
    }

    setGuardando(true);
    try {
      if (editando && usuarioSeleccionado) {
        await UserService.updateUser(usuarioSeleccionado.id_usuario, {
          nombre: formulario.nombre.trim(),
          apellido: formulario.apellido.trim(),
          correo: formulario.correo.trim(),
          telefono: formulario.telefono.trim() || undefined,
          rol: formulario.rol as any,
          estado_cuenta: formulario.estado_cuenta,
          rut: formulario.rut?.trim(),
          fecha_nacimiento: formulario.fecha_nacimiento,
          categoria: formulario.categoria?.trim(),
          posicion: formulario.posicion?.trim(),
          parentesco: formulario.parentesco?.trim(),
          id_jugador_tutorado: formulario.id_jugador_tutorado,
          nuevaPassword: formulario.nuevaPassword || undefined,
        });
        Alert.alert('Éxito', 'Usuario actualizado correctamente');
        setModalVisible(false);
      } else {
        await UserService.createUser({
          nombre: formulario.nombre.trim(),
          apellido: formulario.apellido.trim(),
          correo: formulario.correo.trim(),
          telefono: formulario.telefono.trim() || undefined,
          rol: formulario.rol as any,
          estado_cuenta: formulario.estado_cuenta,
          nuevaPassword: formulario.nuevaPassword!,
          rut: formulario.rut?.trim(),
          fecha_nacimiento: formulario.fecha_nacimiento,
          categoria: formulario.categoria?.trim(),
          posicion: formulario.posicion?.trim(),
          parentesco: formulario.parentesco?.trim(),
          id_jugador_tutorado: formulario.id_jugador_tutorado,
        });
        Alert.alert('Éxito', 'Usuario creado correctamente');
        setModalNuevoUsuario(false);
      }
      onRefreshUsuarios();
    } catch (error: any) {
      console.error('Error guardando usuario:', error);

      if (error.code === '23505') {
        Alert.alert('Error', 'El correo electrónico ya está en uso');
      } else if (error.message?.includes('duplicate key')) {
        Alert.alert('Error', 'Ya existe un usuario con estos datos');
      } else {
        Alert.alert('Error', 'No se pudo guardar el usuario. Inténtalo de nuevo.');
      }
    } finally {
      setGuardando(false);
    }
  }, [formulario, editando, usuarioSeleccionado, validarFormulario, onRefreshUsuarios]);

  const abrirModalEdicion = useCallback((usuario: Usuario) => {
    setUsuarioSeleccionado(usuario);
    setEditando(true);

    const fechaNacimiento = usuario.jugador?.fecha_nacimiento
      ? new Date(usuario.jugador.fecha_nacimiento)
      : new Date();

    setFormulario({
      nombre: usuario.nombre || '',
      apellido: usuario.apellido || '',
      correo: usuario.correo || '',
      telefono: usuario.telefono || '',
      rol: usuario.rol || 'jugador',
      estado_cuenta: usuario.estado_cuenta,
      rut: usuario.jugador?.rut || '',
      fecha_nacimiento: fechaNacimiento,
      categoria: usuario.jugador?.categoria || '',
      posicion: usuario.jugador?.posicion || '',
      parentesco: usuario.apoderado?.parentesco || '',
      id_jugador_tutorado: usuario.apoderado?.id_jugador_tutorado || '',
      nuevaPassword: '',
      confirmarPassword: '',
    });

    limpiarErrores();
    setModalVisible(true);
  }, []);

  const abrirModalNuevoUsuario = useCallback(() => {
    setUsuarioSeleccionado(null);
    setEditando(false);
    setFormulario({
      nombre: '',
      apellido: '',
      correo: '',
      telefono: '',
      rol: 'jugador',
      estado_cuenta: true,
      rut: '',
      fecha_nacimiento: new Date(),
      categoria: '',
      posicion: '',
      parentesco: '',
      nuevaPassword: '',
      confirmarPassword: '',
    });
    limpiarErrores();
    setModalNuevoUsuario(true);
  }, []);

  const cerrarModal = useCallback(() => {
    setModalVisible(false);
    setModalNuevoUsuario(false);
  }, []);

  const limpiarErrores = useCallback(() => {
    setErrores({});
  }, []);

  return {
    formulario,
    setFormulario,
    errores,
    guardando,
    modalVisible,
    modalNuevoUsuario,
    usuarioSeleccionado,
    editando,
    mostrarDatePicker,
    setMostrarDatePicker,
    validarFormulario,
    guardarUsuario,
    abrirModalEdicion,
    abrirModalNuevoUsuario,
    cerrarModal,
    limpiarErrores,
    onRefreshUsuarios,
  };
}
