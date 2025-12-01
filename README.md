# SurVoley - App de Gestión de Club de Voleibol

Aplicación móvil para la gestión integral del club de voleibol SurVoley, desarrollada con React Native (Expo) y Supabase. Permite administrar usuarios, asistencias, mensualidades, entrenamientos y reportes de manera eficiente.

## Características

- **Gestión de Usuarios**: Administración de jugadores, apoderados, entrenadores y administradores
- **Control de Asistencias**: Registro y seguimiento de asistencias a entrenamientos y eventos
- **Gestión de Mensualidades**: Creación automática y manual de mensualidades, seguimiento de pagos
- **Reportes y Estadísticas**: Visualización de métricas y generación de reportes
- **Autenticación Segura**: Sistema de login con persistencia segura usando Expo SecureStore
- **Interfaz Adaptativa**: Diseño responsive para móviles y web

## Tecnologías Utilizadas

- **Frontend**: React Native + Expo
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Lenguaje**: TypeScript
- **Estado**: React Hooks + Context API
- **UI**: Componentes personalizados + React Native Elements
- **Almacenamiento**: Expo SecureStore para datos sensibles

## Prerrequisitos

- Node.js (versión 18 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cuenta en Supabase

## 🔧 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone https://github.com/4r4uz/SurVoley-app.git
cd SurVoley-app
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Supabase

1. Crear un proyecto en [Supabase](https://supabase.com)
2. Obtener las claves API (URL y anon key)

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con:

```env
EXPO_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
EXPO_PUBLIC_SUPABASE_KEY=tu-anon-key-aqui
```

**Seguridad**: Nunca commitear el archivo `.env` al repositorio.

### 5. Configurar la base de datos

El proyecto utiliza **Supabase Auth** para la autenticación de usuarios. Ejecutar el siguiente esquema SQL en el SQL Editor de Supabase para crear las tablas necesarias:

```sql
-- Tablas principales del sistema SurVoley
CREATE TABLE public.Usuarios (
  id_usuario uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_registro timestamp without time zone NOT NULL DEFAULT now(),
  nombre text NOT NULL,
  apellido text NOT NULL,
  correo text NOT NULL UNIQUE,
  rol character varying NOT NULL,
  telefono character varying,
  estado_cuenta boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  auth_id uuid,
  password text NOT NULL,
  CONSTRAINT Usuarios_pkey PRIMARY KEY (id_usuario),
  CONSTRAINT Usuarios_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);

CREATE TABLE public.Jugador (
  id_jugador uuid NOT NULL DEFAULT gen_random_uuid(),
  rut character varying NOT NULL UNIQUE,
  fecha_nacimiento date,
  categoria character varying CHECK (categoria::text = ANY (ARRAY['Sub-13'::character varying, 'Sub-15'::character varying, 'Sub-17'::character varying, 'Sub-19'::character varying]::text[])),
  posicion character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Jugador_pkey PRIMARY KEY (id_jugador),
  CONSTRAINT Jugador_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.Usuarios(id_usuario)
);

CREATE TABLE public.Apoderado (
  id_apoderado uuid NOT NULL DEFAULT gen_random_uuid(),
  parentesco character varying NOT NULL,
  id_jugador_tutorado uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Apoderado_pkey PRIMARY KEY (id_apoderado),
  CONSTRAINT Apoderado_id_apoderado_fkey FOREIGN KEY (id_apoderado) REFERENCES public.Usuarios(id_usuario),
  CONSTRAINT Apoderado_id_jugador_tutorado_fkey FOREIGN KEY (id_jugador_tutorado) REFERENCES public.Jugador(id_jugador)
);

CREATE TABLE public.Asistencia (
  id_asistencia uuid NOT NULL DEFAULT gen_random_uuid(),
  estado_asistencia character varying CHECK (estado_asistencia::text = ANY (ARRAY['Presente'::character varying::text, 'Ausente'::character varying::text, 'Justificado'::character varying::text, 'Sin registro'::character varying::text])),
  id_jugador uuid,
  id_entrenamiento uuid,
  fecha_asistencia date DEFAULT CURRENT_DATE,
  id_evento uuid,
  CONSTRAINT Asistencia_pkey PRIMARY KEY (id_asistencia),
  CONSTRAINT Asistencia_id_entrenamiento_fkey FOREIGN KEY (id_entrenamiento) REFERENCES public.Entrenamiento(id_entrenamiento),
  CONSTRAINT Asistencia_id_evento_fkey FOREIGN KEY (id_evento) REFERENCES public.Evento(id_evento),
  CONSTRAINT Asistencia_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.Jugador(id_jugador)
);

CREATE TABLE public.Certificado (
  id_certificado uuid NOT NULL DEFAULT gen_random_uuid(),
  tipo_certificado character varying,
  fecha_emision date,
  fecha_vencimiento date,
  url text,
  id_jugador uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Certificado_pkey PRIMARY KEY (id_certificado),
  CONSTRAINT Certificado_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.Jugador(id_jugador)
);

CREATE TABLE public.Entrenamiento (
  id_entrenamiento uuid NOT NULL DEFAULT gen_random_uuid(),
  fecha_hora timestamp with time zone NOT NULL DEFAULT now(),
  lugar character varying,
  id_entrenador uuid,
  duracion_minutos integer,
  descripcion text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Entrenamiento_pkey PRIMARY KEY (id_entrenamiento),
  CONSTRAINT Entrenamiento_id_entrenador_fkey FOREIGN KEY (id_entrenador) REFERENCES public.Usuarios(id_usuario)
);

CREATE TABLE public.Evento (
  id_evento uuid NOT NULL DEFAULT gen_random_uuid(),
  titulo character varying NOT NULL,
  tipo_evento character varying CHECK (tipo_evento::text = ANY (ARRAY['Partido'::character varying::text, 'Torneo'::character varying::text, 'Amistoso'::character varying::text, 'Entrenamiento'::character varying::text])),
  fecha_hora timestamp without time zone,
  ubicacion character varying,
  id_organizador uuid,
  Hora_inicio time without time zone NOT NULL DEFAULT now(),
  Hora_fin time without time zone NOT NULL DEFAULT now(),
  CONSTRAINT Evento_pkey PRIMARY KEY (id_evento),
  CONSTRAINT Evento_id_organizador_fkey FOREIGN KEY (id_organizador) REFERENCES public.Usuarios(id_usuario)
);

CREATE TABLE public.Mensualidad (
  id_mensualidad uuid NOT NULL DEFAULT gen_random_uuid(),
  monto numeric NOT NULL CHECK (monto >= 0::numeric),
  fecha_pago timestamp without time zone DEFAULT now(),
  metodo_pago character varying,
  estado_pago character varying NOT NULL CHECK (estado_pago::text = ANY (ARRAY['Pendiente'::character varying::text, 'Pagado'::character varying::text, 'Cancelado'::character varying::text])),
  id_jugador uuid,
  fecha_vencimiento date,
  mes_referencia character varying,
  anio_referencia integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT Mensualidad_pkey PRIMARY KEY (id_mensualidad),
  CONSTRAINT Mensualidad_id_jugador_fkey FOREIGN KEY (id_jugador) REFERENCES public.Jugador(id_jugador)
);
```

## Ejecución

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npx expo start
```

## Uso de la Aplicación

### Roles de Usuario

1. **Administrador**: Acceso completo a todas las funcionalidades
2. **Jugador**: Visualización de asistencias y mensualidades propias
3. **Apoderado**: Gestión de asistencias y mensualidades de jugadores a cargo
4. **Entrenador**: Registro de asistencias y gestión de entrenamientos

### Funcionalidades Principales

- **Login Seguro**: Autenticación con persistencia de sesión
- **Dashboard Personalizado**: Según rol del usuario
- **Gestión de Asistencias**: Marcado automático/manual de asistencias
- **Control de Mensualidades**: Generación automática mensual, seguimiento de pagos
- **Reportes**: Estadísticas y exportación de datos

## Estructura del Proyecto

```
src/
├── app/                    # Páginas/Rutas (Expo Router)
│   ├── (auth)/            # Rutas de autenticación
│   ├── (admin)/           # Rutas de administrador
│   ├── (jugador)/         # Rutas de jugador
│   ├── (apoderado)/       # Rutas de apoderado
│   └── (entrenador)/      # Rutas de entrenador
├── core/                  # Lógica de negocio
│   ├── auth/             # Autenticación y contexto
│   ├── hooks/            # Hooks personalizados
│   ├── services/         # Servicios de API (Supabase)
│   └── types/            # Definiciones TypeScript
├── shared/                # Componentes y utilidades compartidas
│   ├── components/       # Componentes reutilizables
│   └── constants/        # Constantes y configuración
└── assets/               # Imágenes y recursos estáticos
```

## Build para Producción

### Usando EAS (Expo Application Services)

1. Instalar EAS CLI:
```bash
npm install -g eas-cli
```

2. Configurar proyecto:
```bash
eas build:configure
```

3. Build para plataformas:
```bash
# Android
eas build --platform android

# iOS
eas build --platform ios
```

### Configuración EAS

El proyecto incluye configuración básica en `eas.json`. Ajustar según necesidades de distribución.

## Seguridad

- **Autenticación**: JWT tokens manejados por Supabase
- **Almacenamiento Seguro**: Expo SecureStore para datos sensibles
- **RLS**: Políticas de seguridad a nivel de fila en Supabase
- **Validación**: Validación de datos en cliente y servidor

## Contribución

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Agrega nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Soporte

Para soporte técnico o reportes de bugs, crear un issue en el repositorio de GitHub.

## Agradecimientos

- Equipo de desarrollo de Expo
- Comunidad de Supabase
