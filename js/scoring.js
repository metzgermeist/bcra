
/* ---------- SCORE BASE ---------- */
// Datos de entrada: situacion viene de periodos[0].entidades[*].situacion
// dentro de la respuesta del BCRA (results.periodos).
function calcularScoringBase(situacion) {
    // Asigna un score base segun la situacion actual.
    switch (situacion) {
        case 1: return 80;
        case 2: return 55;
        case 3: return 35;
        case 4: return 15;
        case 5:
        case 6: return 0;
        default: return 65; // sin datos
    }
}

/* ---------- FECHAS ---------- */
// Normaliza el campo periodo (periodos[*].periodo) que viene de BCRA.
function obtenerAnioMes(periodoTexto) {
    // Validamos que el periodo exista y sea string.
    if (!periodoTexto || typeof periodoTexto !== "string") return null;

    // Limpiamos espacios para evitar errores de formato.
    const limpio = periodoTexto.trim();
    if (!limpio) return null;

    // Variables de salida.
    let anio;
    let mes;

    // Formato esperado "YYYY-MM".
    if (/^\d{4}-\d{2}$/.test(limpio)) {
        [anio, mes] = limpio.split("-").map(Number);
    } else if (/^\d{6}$/.test(limpio)) {
        // Formato alternativo "YYYYMM".
        anio = Number(limpio.slice(0, 4));
        mes = Number(limpio.slice(4, 6));
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(limpio)) {
        // Formato "YYYY-MM-DD" (tomamos anio y mes).
        const partes = limpio.split("-");
        anio = Number(partes[0]);
        mes = Number(partes[1]);
    } else {
        // Formato no reconocido.
        return null;
    }

    // Validamos que anio y mes sean numeros validos.
    if (!Number.isFinite(anio) || !Number.isFinite(mes)) return null;
    return { anio, mes };
}

function estaEnUltimos24Meses(periodoYYYYMM) {
    // Convierte el periodo a anio y mes.
    const datos = obtenerAnioMes(periodoYYYYMM);
    if (!datos) return false;

    // Construye la fecha del periodo y el rango de 24 meses.
    const fechaPeriodo = new Date(datos.anio, datos.mes - 1);
    const hoy = new Date();
    const hace24Meses = new Date(
        hoy.getFullYear(),
        hoy.getMonth() - 24,
        1
    );

    // Verifica si esta dentro del rango.
    return fechaPeriodo >= hace24Meses && fechaPeriodo <= hoy;
}

/* ---------- VARIABLES DEL SCORING ---------- */
// periodos viene de BCRA: results.periodos (cada periodo con entidades).
function maxSituacionActual(periodos) {
    // Toma el primer periodo (ultimo mes) como "actual".
    if (!periodos || periodos.length === 0) return 0;

    // Busca la peor situacion dentro del periodo actual.
    let max = 0;
    for (const entidad of periodos[0].entidades) {
        if (entidad.situacion > max) {
            max = entidad.situacion;
        }
    }
    return max;
}

function peorSituacion24m(periodos) {
    // Busca la peor situacion de los ultimos 24 meses.
    let peor = 0;

    for (const periodo of periodos) {
        // Filtra por periodos dentro de 24 meses.
        if (!estaEnUltimos24Meses(periodo.periodo)) continue;

        for (const entidad of periodo.entidades) {
            if (entidad.situacion > peor) {
                peor = entidad.situacion;
            }
        }
    }
    return peor;
}

function mesesMora24m(periodos) {
    // Cuenta meses con mora (>1) dentro de los ultimos 24 meses.
    let meses = 0;

    for (const periodo of periodos) {
        if (!estaEnUltimos24Meses(periodo.periodo)) continue;

        for (const entidad of periodo.entidades) {
            if (entidad.situacion > 1) {
                meses++;
                break;
            }
        }
    }
    return meses;
}

function recenciaMora(periodos) {
    // Calcula cuantos meses pasaron desde la ultima mora.
    const hoy = new Date();

    for (const periodo of periodos) {
        for (const entidad of periodo.entidades) {
            if (entidad.situacion > 1) {
                // Usa el periodo del registro con mora.
                const datos = obtenerAnioMes(periodo.periodo);
                if (!datos) {
                    continue;
                }

                const fechaMora = new Date(datos.anio, datos.mes - 1);

                return (
                    (hoy.getFullYear() - fechaMora.getFullYear()) * 12 +
                    (hoy.getMonth() - fechaMora.getMonth())
                );
            }
        }
    }
    return 999; // nunca tuvo mora
}

function cantidadEntidadesActual(periodos) {
    // Cuenta entidades del periodo actual (ultimo mes).
    if (!periodos || periodos.length === 0) return 0;
    return periodos[0].entidades.length;
}

/* ---------- AJUSTES ---------- */
// Ajustes negativos segun la peor situacion en 24 meses.
function ajustePeorSituacion24m(valor) {
    if (valor === 1) return 0;
    if (valor === 2) return -5;
    if (valor === 3) return -12;
    if (valor === 4) return -20;
    if (valor >= 5) return -35;
    return 0;
}

// Ajustes segun cantidad de meses en mora.
function ajusteMesesMora(meses) {
    if (meses === 0) return 0;
    if (meses <= 2) return -5;
    if (meses <= 5) return -12;
    if (meses <= 10) return -20;
    return -30;
}

// Ajustes segun cuan reciente fue la mora.
function ajusteRecenciaMora(meses) {
    if (meses <= 2) return -20;
    if (meses <= 5) return -12;
    if (meses <= 11) return -6;
    return 0;
}

// Ajustes segun cantidad de entidades en el periodo actual.
function ajusteCantidadEntidades(cant) {
    if (cant <= 1) return 0;
    if (cant <= 3) return -4;
    if (cant <= 6) return -8;
    return -12;
}

// Ajustes segun cheques rechazados en 12 meses.
function ajusteCheques(cant) {
    if (cant === 0) return 0;
    if (cant === 1) return -8;
    if (cant === 2) return -15;
    return -30;
}

/* ---------- SCORE FINAL ---------- */
// periodos: results.periodos (BCRA), cheques12m: total de cheques rechazados.
function calcularScoreFinal(periodos, cheques12m) {
    // Score base segun la situacion actual.
    const situacionActual = maxSituacionActual(periodos);
    let score = calcularScoringBase(situacionActual);

    // Ajustes negativos por historia y comportamiento.
    score += ajustePeorSituacion24m(peorSituacion24m(periodos));
    score += ajusteMesesMora(mesesMora24m(periodos));
    score += ajusteRecenciaMora(recenciaMora(periodos));
    score += ajusteCantidadEntidades(cantidadEntidadesActual(periodos));
    score += ajusteCheques(cheques12m);

    // Limites del score final.
    if (score < 0) score = 0;
    if (score > 100) score = 100;

    return score;
}


/* ---------- CATEGORIA ---------- */
// Devuelve el texto de categoria segun el score calculado.
function categorias(score){
    if (score<=100 && score>=80) {
        return "Categoria 1"
    }
    if (score<=79 && score>=65) {
        return "Categoria 2"
    }
    if (score<=64 && score>=50) {
        return "Categoria 3"
    }
    if (score<=49 && score>=35) {
        return "Categoria 4"
    }
    if (score<=34 && score>=0) {
        return "Categoria 5"
    }
}
