/* global calcularScoreFinal, categorias, maxSituacionActual, peorSituacion24m, mesesMora24m, recenciaMora, cantidadEntidadesActual, contarChequesUltimos12Meses, obtenerDiasAtraso, obtenerPeriodos, textoValor, obtenerPeriodoActual, obtenerEntidadesActual, obtenerMontoTotal, DatosPersonales, Cliente, guardarCliente, Swal */
// Render principal: arma y muestra el resumen de scoring en #salida.
// Datos de entrada:
// - nombre, apellido, direccion, cuil: vienen del formulario.
// - ind, hist, cheq: respuestas de BCRA ya parseadas (manejoRespuesta).
function renderizarSalida({ nombre, apellido, direccion, cuil, ind, hist, cheq }) {
  // Busca el contenedor y corta si no existe.
  const salida = document.getElementById("salida");
  if (!salida) {
    return;
  }

  // Limpia el resultado anterior.
  salida.innerHTML = "";
  salida.classList.remove("cerrando");

  // Titulo del bloque de salida.
  const titulo = document.createElement("h2");
  titulo.textContent = "Resultados del cliente (ultimo mes)";
  salida.appendChild(titulo);

  // Prioriza periodos historicos si existen.
  // periodos viene de BCRA: results.periodos.
  const periodosHist = obtenerPeriodos(hist);
  const periodosInd = obtenerPeriodos(ind);
  let periodos = periodosInd;

  if (periodosHist.length > 0) {
    periodos = periodosHist;
  }

  // Identifica el periodo actual y sus entidades.
  // periodoActual toma periodos[0] (ultimo mes disponible).
  const periodoActual = obtenerPeriodoActual(periodos);
  const entidadesActual = obtenerEntidadesActual(periodos);
  const montoTotal = obtenerMontoTotal(periodos);
  const periodoTexto = periodoActual ? periodoActual : "Sin datos";
  const montoTexto = montoTotal === null ? "Sin datos" : montoTotal;

  // Cuenta cheques rechazados en los ultimos 12 meses.
  // cheq viene de BCRA: endpoint de cheques rechazados.
  const cheques12m = contarChequesUltimos12Meses(cheq);

  // Valores por defecto si no hay datos.
  let score = "Sin datos";
  let categoria = "Sin datos";
  let situacionActual = "Sin datos";
  let peor24m = "Sin datos";
  let mesesMora = "Sin datos";
  let recenciaTexto = "Sin datos";
  let cantidadEntidades = "Sin datos";
  let diasAtrasoTexto = "Sin datos";

  // Calcula metricas si hay periodos disponibles.
  // Todas estas funciones estan en scoring.js y usan periodos de BCRA.
  if (periodos.length > 0) {
    score = calcularScoreFinal(periodos, cheques12m);
    categoria = categorias(score);
    situacionActual = maxSituacionActual(periodos);
    peor24m = peorSituacion24m(periodos);
    mesesMora = mesesMora24m(periodos);

    const recencia = recenciaMora(periodos);
    if (recencia === 999) {
      recenciaTexto = "Sin mora";
    } else {
      recenciaTexto = recencia;
    }

    cantidadEntidades = cantidadEntidadesActual(periodos);

    const diasAtraso = obtenerDiasAtraso(periodos);
    if (diasAtraso === null) {
      diasAtrasoTexto = "Sin datos";
    } else {
      diasAtrasoTexto = diasAtraso;
    }
  } else if (ind === "sin-evidencia") {
    // Sin evidencia: el score base queda en 65 y la categoria no se informa.
    score = 65;
    categoria = "Sin datos";
  }

  // Estructura de datos a mostrar en pantalla.
  // Cada item define etiqueta, valor y opcionalmente tipo/clase.
  const datos = [
    { etiqueta: "Nombre", valor: nombre },
    { etiqueta: "Apellido", valor: apellido },
    { etiqueta: "Direccion", valor: direccion },
    { etiqueta: "CUIL/CUIT", valor: cuil },
    { etiqueta: "Periodo (ultimo mes)", valor: periodoTexto },
    {
      etiqueta: "Entidades (ultimo mes)",
      tipo: "lista",
      valores: entidadesActual
    },
    { etiqueta: "Monto total (ultimo mes) (en miles de pesos)", valor: montoTexto },
    {
      etiqueta: "Score",
      valor: score,
      clase: obtenerClaseScore(score)
    },
    {
      etiqueta: "Categoria",
      valor: categoria,
      clase: obtenerClaseCategoria(categoria)
    },
    { etiqueta: "Cheques rechazados", valor: cheques12m },
    { etiqueta: "Meses de mora", valor: mesesMora },
    { etiqueta: "Recencia de mora (meses)", valor: recenciaTexto },
    { etiqueta: "Peor situacion", valor: peor24m },
    { etiqueta: "Situacion actual", valor: situacionActual },
    { etiqueta: "Cantidad de entidades", valor: cantidadEntidades },
    { etiqueta: "Tiempo de atraso (dias)", valor: diasAtrasoTexto }
  ];

  // Crea el contenedor de filas y lo llena con pares etiqueta/valor.
  const contenedor = document.createElement("div");
  contenedor.className = "salida-contenedor";

  for (const item of datos) {
    if (item.tipo === "lista") {
      // Render de lista para entidades del ultimo mes.
      const fila = document.createElement("section");
      fila.className = "salida-fila salida-fila-lista";

      const etiqueta = document.createElement("span");
      etiqueta.className = "salida-etiqueta";
      etiqueta.textContent = item.etiqueta + ": ";
      fila.appendChild(etiqueta);

      if (item.valores && item.valores.length > 0) {
        const lista = document.createElement("ul");
        lista.className = "salida-lista-entidades";

        for (const valorEntidad of item.valores) {
          const li = document.createElement("li");
          li.className = "salida-item-entidad";
          li.textContent = valorEntidad;
          lista.appendChild(li);
        }

        fila.appendChild(lista);
      } else {
        const valor = document.createElement("span");
        valor.className = "salida-valor";
        valor.textContent = "Sin datos";
        fila.appendChild(valor);
      }

      contenedor.appendChild(fila);
      continue;
    }

    // Render de fila simple (texto plano).
    const fila = document.createElement("p");
    fila.className = "salida-fila";

    const etiqueta = document.createElement("span");
    etiqueta.className = "salida-etiqueta";
    etiqueta.textContent = item.etiqueta + ": ";

    const valor = document.createElement("span");
    valor.className = "salida-valor";
    if (item.clase) {
      valor.classList.add(item.clase);
    }
    valor.textContent = textoValor(item.valor);

    fila.appendChild(etiqueta);
    fila.appendChild(valor);
    contenedor.appendChild(fila);
  }
  // Acciones: guardar cliente o cerrar resultados.
  const acciones = document.createElement("div");
  acciones.className = "acciones-salida";

  const botonagregar = document.createElement("button");
  botonagregar.type = "button";
  botonagregar.className = "boton-principal";
  botonagregar.textContent = "Agregar cliente";
  botonagregar.addEventListener("click", () => {
    // Guarda en localStorage usando persistencia.js
    // y las clases definidas en clientes.js
    const datosPersonales = new DatosPersonales(nombre, apellido, cuil, direccion);
    const cliente = new Cliente(datosPersonales, score, categoria);
    const resultado = guardarCliente(cliente);
    if (resultado === "EXITO") {
      Swal.fire({
        title: "Cliente guardado",
        text: "Se guardo correctamente en el almacenamiento local.",
        icon: "success"
      });
    }
  });

  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.className = "boton-secundario";
  botonCerrar.textContent = "Cerrar";
  botonCerrar.addEventListener("click", () => {
    // Animacion suave de cierre.
    salida.classList.add("cerrando");
    setTimeout(() => {
      salida.innerHTML = "";
      salida.classList.remove("cerrando");
    }, 650);
  });

  acciones.appendChild(botonagregar);
  acciones.appendChild(botonCerrar);

  salida.appendChild(contenedor);
  salida.appendChild(acciones);
}

// Devuelve la clase CSS segun la categoria del score.
function obtenerClaseCategoria(valor) {
  if (!valor || typeof valor !== "string") {
    return "";
  }

  if (valor === "Categoria 1") return "categoria-1";
  if (valor === "Categoria 2") return "categoria-2";
  if (valor === "Categoria 3") return "categoria-3";
  if (valor === "Categoria 4") return "categoria-4";
  if (valor === "Categoria 5") return "categoria-5";

  return "";
}

// Devuelve la clase CSS segun el rango del score.
function obtenerClaseScore(valor) {
  if (!Number.isFinite(valor)) {
    return "";
  }

  if (valor >= 65) return "score-verde";
  if (valor >= 50) return "score-naranja";
  return "score-rojo";
}
