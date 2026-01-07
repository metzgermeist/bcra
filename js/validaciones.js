

//-----------------------Funciones de validaciones---------------//
function normalizarNombre(nombre) {

    nombre=nombre.toLowerCase();
    nombre=nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, "");
    nombre=nombre.trim();

    return nombre;
}

function normalizarNumero(cuil) {
    cuil=cuil.replace(/[^0-9]/g, "");
    return cuil;
}