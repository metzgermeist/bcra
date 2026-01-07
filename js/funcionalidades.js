// Convierte un valor a texto visible y normaliza vacios.
function textoValor(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return "Sin datos";
  }
  return String(valor);
}

// Extrae periodos desde distintas formas de respuesta.
function obtenerPeriodos(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  if (Array.isArray(data.periodos)) {
    return data.periodos;
  }

  if (data.results && Array.isArray(data.results.periodos)) {
    return data.results.periodos;
  }

  if (data.resultados && Array.isArray(data.resultados.periodos)) {
    return data.resultados.periodos;
  }

  if (data.resultado && Array.isArray(data.resultado.periodos)) {
    return data.resultado.periodos;
  }

  if (data.data && Array.isArray(data.data.periodos)) {
    return data.data.periodos;
  }

  return [];
}

// Obtiene el mayor dias de atraso encontrado en el periodo actual.
function obtenerDiasAtraso(periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) {
    return null;
  }

  const entidades = Array.isArray(periodos[0].entidades)
    ? periodos[0].entidades
    : [];
  let maxDias = null;

  for (const entidad of entidades) {
    let valor = entidad.diasAtrasoPago;
    if (!Number.isFinite(valor)) {
      valor = entidad.diasAtraso;
    }

    if (Number.isFinite(valor)) {
      if (maxDias === null) {
        maxDias = valor;
      } else {
        maxDias = Math.max(maxDias, valor);
      }
    }
  }

  return maxDias;
}

// Obtiene el periodo actual (ultimo mes) si existe.
function obtenerPeriodoActual(periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) {
    return null;
  }

  const periodo = periodos[0].periodo;
  if (periodo === null || periodo === undefined || periodo === "") {
    return null;
  }

  return String(periodo);
}

// Obtiene las entidades del periodo actual sin duplicados.
function obtenerEntidadesActual(periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) {
    return [];
  }

  const entidades = Array.isArray(periodos[0].entidades)
    ? periodos[0].entidades
    : [];
  const nombres = [];

  for (const entidad of entidades) {
    if (!entidad || entidad.entidad === null || entidad.entidad === undefined) {
      continue;
    }

    const nombre = String(entidad.entidad).trim();
    if (!nombre) {
      continue;
    }

    if (!nombres.includes(nombre)) {
      nombres.push(nombre);
    }
  }

  return nombres;
}

// Obtiene el monto total del periodo actual si existe.
function obtenerMontoTotal(periodos) {
  if (!Array.isArray(periodos) || periodos.length === 0) {
    return null;
  }

  const entidades = Array.isArray(periodos[0].entidades)
    ? periodos[0].entidades
    : [];
  let total = 0;
  let encontro = false;

  for (const entidad of entidades) {
    if (!entidad) {
      continue;
    }

    const valor = Number(entidad.monto);
    if (Number.isFinite(valor)) {
      total += valor;
      encontro = true;
    }
  }

  return encontro ? total : null;
}

// Cuenta cheques rechazados en los ultimos 12 meses si hay fechas.
function contarChequesUltimos12Meses(data) {
  const cheques = obtenerCheques(data);
  const cantidadDirecta = obtenerCantidadCheques(data);

  if (cheques.length === 0 && Number.isFinite(cantidadDirecta)) {
    return cantidadDirecta;
  }

  if (cheques.length === 0) {
    return 0;
  }

  const hoy = new Date();
  const limite = new Date(hoy.getFullYear(), hoy.getMonth() - 12, hoy.getDate());
  let conFecha = 0;
  let contados = 0;

  for (const cheque of cheques) {
    const fecha = obtenerFechaCheque(cheque);
    if (fecha) {
      conFecha += 1;
      if (fecha >= limite && fecha <= hoy) {
        contados += 1;
      }
    }
  }

  if (conFecha > 0) {
    return contados;
  }

  return cheques.length;
}

// Obtiene el arreglo de cheques desde distintas estructuras.
function obtenerCheques(data) {
  if (!data || typeof data !== "object") {
    return [];
  }

  if (Array.isArray(data.chequesRechazados)) {
    return data.chequesRechazados;
  }

  if (Array.isArray(data.cheques)) {
    return data.cheques;
  }

  if (data.resultados && Array.isArray(data.resultados.chequesRechazados)) {
    return data.resultados.chequesRechazados;
  }

  if (data.resultado && Array.isArray(data.resultado.chequesRechazados)) {
    return data.resultado.chequesRechazados;
  }

  if (data.data && Array.isArray(data.data.chequesRechazados)) {
    return data.data.chequesRechazados;
  }

  return [];
}

// Usa un contador directo si el endpoint lo expone.
function obtenerCantidadCheques(data) {
  if (!data || typeof data !== "object") {
    return null;
  }

  if (Number.isFinite(data.cantidadChequesRechazados)) {
    return data.cantidadChequesRechazados;
  }

  if (Number.isFinite(data.cantidadCheques)) {
    return data.cantidadCheques;
  }

  if (Number.isFinite(data.cantidad)) {
    return data.cantidad;
  }

  if (data.resultados && Number.isFinite(data.resultados.cantidadChequesRechazados)) {
    return data.resultados.cantidadChequesRechazados;
  }

  return null;
}

// Normaliza la fecha de un cheque con distintos nombres de campo.
function obtenerFechaCheque(cheque) {
  if (!cheque || typeof cheque !== "object") {
    return null;
  }

  const valor =
    cheque.fechaRechazo ||
    cheque.fecha ||
    cheque.fechaEmision ||
    cheque.fechaPago ||
    cheque.fechaRechazoPago;

  return parseFecha(valor);
}

// Parsea fechas en formatos comunes: YYYY-MM-DD, YYYY-MM, YYYYMMDD, DD/MM/YYYY.
function parseFecha(valor) {
  if (!valor || typeof valor !== "string") {
    return null;
  }

  const normal = valor.trim();
  if (!normal) {
    return null;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normal)) {
    return new Date(normal + "T00:00:00");
  }

  if (/^\d{4}-\d{2}$/.test(normal)) {
    return new Date(normal + "-01T00:00:00");
  }

  if (/^\d{8}$/.test(normal)) {
    const anio = normal.slice(0, 4);
    const mes = normal.slice(4, 6);
    const dia = normal.slice(6, 8);
    return new Date(anio + "-" + mes + "-" + dia + "T00:00:00");
  }

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normal)) {
    const partes = normal.split("/");
    return new Date(partes[2] + "-" + partes[1] + "-" + partes[0] + "T00:00:00");
  }

  const fecha = new Date(normal);
  if (Number.isNaN(fecha.getTime())) {
    return null;
  }

  return fecha;
}
