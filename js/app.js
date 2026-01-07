const form = document.getElementById("formCliente");
const botonVerClientes = document.getElementById("verClientes");
const contenedorClientes = document.getElementById("TodosClientes");

if (!form) {
  throw new Error("No se encontro el formulario");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  let nombre = document.getElementById("nombre").value;
  let apellido = document.getElementById("apellido").value;
  let direccion = document.getElementById("direccion").value;
  let cuil = document.getElementById("cuil").value;

  nombre = normalizarNombre(nombre);
  apellido = normalizarNombre(apellido);
  direccion = direccion.trim();
  cuil = normalizarNumero(cuil);

  let ind;
  let hist;
  let cheq;

  try {
    const rInd = await ConsultarDatos(cuil);
    const rHist = await ConsultarDatosHistoricos(cuil);
    const rCheq = await ConsultarDatosCheques(cuil);

    ind = await manejoRespuesta(rInd);
    hist = await manejoRespuesta(rHist);
    cheq = await manejoRespuesta(rCheq);
  } catch (error) {
    await Swal.fire({
      title: "Error del servidor",
      text: "Ocurrio un error al consultar el servicio.",
      icon: "error"
    });
    return;
  }

  if (ind === "sin-evidencia") {
    const respuesta = await Swal.fire({
      title: "Sin evidencia",
      text: "no hay registros del usario desea continuar con el lata de clientes",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Si, continuar",
      cancelButtonText: "No, cancelar"
    });
    if (!respuesta.isConfirmed) {
      return;
    }
  }

  if (ind === "error del servidor") {
    await Swal.fire({
      title: "Error del servidor",
      text: "Ocurrio un error al consultar el servicio.",
      icon: "error"
    });
    return;
  }

  renderizarSalida({
    nombre,
    apellido,
    direccion,
    cuil,
    ind,
    hist,
    cheq
  });

});

if (botonVerClientes && contenedorClientes) {
  botonVerClientes.addEventListener("click", () => {
    const clientes = obtenerClientes();
    renderizarClientesGuardados(clientes, contenedorClientes);
  });
}

function renderizarClientesGuardados(clientes, contenedor) {
  let panel = contenedor.querySelector(".panel-clientes");
  if (!panel) {
    panel = document.createElement("section");
    panel.className = "panel-clientes";
    contenedor.appendChild(panel);
  }

  panel.innerHTML = "";

  const encabezado = document.createElement("header");
  encabezado.className = "panel-clientes-encabezado";

  const titulo = document.createElement("h3");
  titulo.textContent = "Clientes guardados";

  const botonCerrar = document.createElement("button");
  botonCerrar.type = "button";
  botonCerrar.className = "boton-secundario";
  botonCerrar.textContent = "Cerrar";
  botonCerrar.addEventListener("click", () => {
    panel.classList.add("cerrando");
    setTimeout(() => {
      panel.remove();
    }, 650);
  });

  encabezado.appendChild(titulo);
  encabezado.appendChild(botonCerrar);
  panel.appendChild(encabezado);

  if (!Array.isArray(clientes) || clientes.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "salida-fila";
    vacio.textContent = "No hay clientes guardados.";
    panel.appendChild(vacio);
    return;
  }

  const tabla = document.createElement("table");
  tabla.className = "tabla-clientes";

  const cabecera = document.createElement("thead");
  const filaCabecera = document.createElement("tr");
  const columnas = ["Nombre", "Direccion", "CUIL/CUIT", "Score", "Categoria", "Acciones"];

  for (const columna of columnas) {
    const th = document.createElement("th");
    th.scope = "col";
    th.textContent = columna;
    filaCabecera.appendChild(th);
  }

  cabecera.appendChild(filaCabecera);
  tabla.appendChild(cabecera);

  const cuerpo = document.createElement("tbody");

  for (const cliente of clientes) {
    const datos = cliente && cliente.datosPersonales ? cliente.datosPersonales : {};
    const nombreCompleto = [datos.nombre, datos.apellido].filter(Boolean).join(" ");
    const direccionTabla = datos.domicilio ? datos.domicilio : "Sin direccion";
    let cuit = datos.cuit || datos.cuil;
    if (!cuit) {
      cuit = "Sin CUIL";
    } else {
      cuit = formatearCuit(cuit);
    }
    const score = Number.isFinite(cliente.score) ? cliente.score : "Sin score";
    const categoria = cliente.categoria ? cliente.categoria : "Sin categoria";

    const fila = document.createElement("tr");

    const celdaNombre = document.createElement("td");
    celdaNombre.textContent = nombreCompleto || "Sin nombre";
    fila.appendChild(celdaNombre);

    const celdaDireccion = document.createElement("td");
    celdaDireccion.textContent = direccionTabla;
    fila.appendChild(celdaDireccion);

    const celdaCuit = document.createElement("td");
    celdaCuit.textContent = cuit;
    fila.appendChild(celdaCuit);

    const celdaScore = document.createElement("td");
    celdaScore.textContent = score;
    fila.appendChild(celdaScore);

    const celdaCategoria = document.createElement("td");
    celdaCategoria.textContent = categoria;
    fila.appendChild(celdaCategoria);

    const celdaAcciones = document.createElement("td");
    const botonEliminar = document.createElement("button");
    botonEliminar.type = "button";
    botonEliminar.className = "boton-secundario boton-eliminar";
    botonEliminar.textContent = "Eliminar";
    botonEliminar.addEventListener("click", () => {
      fila.classList.add("fila-borrando");
      botonEliminar.disabled = true;

      setTimeout(() => {
        const resultado = eliminarCliente(cuit.replace(/\D/g, ""));
        if (resultado === "EXITO") {
          const clientesActualizados = obtenerClientes();
          renderizarClientesGuardados(clientesActualizados, contenedor);
        }
      }, 1000);
    });
    celdaAcciones.appendChild(botonEliminar);
    fila.appendChild(celdaAcciones);

    cuerpo.appendChild(fila);
  }

  tabla.appendChild(cuerpo);
  panel.appendChild(tabla);
}

function formatearCuit(valor) {
  if (!valor) {
    return valor;
  }

  const digitos = String(valor).replace(/\D/g, "");
  if (digitos.length !== 11) {
    return String(valor);
  }

  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
}

