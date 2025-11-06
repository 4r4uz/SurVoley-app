//Utilidades para formateo y manipulación de fechas

export interface FormattedDate {
  day: number;
  month: string;
  weekday: string;
  time: string;
}

//Formatea una fecha a un formato legible con información detallada

export const formatDate = (dateString: string): FormattedDate => {
  try {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("es-ES", { month: "short" }),
      weekday: date.toLocaleDateString("es-ES", { weekday: "short" }),
      time: date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  } catch {
    return {
      day: 0,
      month: "???",
      weekday: "---",
      time: "--:--",
    };
  }
};

//Formatea una fecha a formato corto (sin hora)

export const formatDateShort = (dateString: string | null): string => {
  if (!dateString) return "Pendiente";
  try {
    const fecha = new Date(dateString);
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Fecha inválida";
  }
};

// Formatea fecha y hora completa

export const formatDateTime = (dateTimeString: string): string => {
  if (!dateTimeString) return "Fecha no definida";
  try {
    const fecha = new Date(dateTimeString);
    return fecha.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "Fecha inválida";
  }
};

//Obtiene el nombre del mes
 
export const obtenerNombreMes = (mes: string): string => {
  const meses: { [key: string]: string } = {
    "01": "Enero",
    "02": "Febrero",
    "03": "Marzo",
    "04": "Abril",
    "05": "Mayo",
    "06": "Junio",
    "07": "Julio",
    "08": "Agosto",
    "09": "Septiembre",
    "10": "Octubre",
    "11": "Noviembre",
    "12": "Diciembre",
  };
  return meses[mes] || mes;
};

//Formatea un monto a formato de moneda chilena
 
export const formatearMonto = (monto: number): string => {
  return `$${monto.toLocaleString("es-CL")}`;
};

