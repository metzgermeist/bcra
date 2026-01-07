class DatosPersonales {
  constructor(nombre, apellido, cuit, domicilio) {
    this.nombre = nombre;
    this.apellido = apellido;
    this.cuit = cuit;
    this.domicilio = domicilio;
  }
}


class Cliente {
  constructor(
    datosPersonales,score,categoria) {
    this.datosPersonales = datosPersonales;
    this.score = score;
    this.categoria = categoria;
  }
}

