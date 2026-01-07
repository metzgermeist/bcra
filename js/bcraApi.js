//-------------obtener datos de api---------------//
async function ConsultarDatos(cuil) {

    const respuesta = await fetch(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/${cuil}`);
    return respuesta;


}

async function ConsultarDatosHistoricos(cuil) {

    const respuestaHistorica = await fetch(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/Historicas/${cuil}`);
    return respuestaHistorica;


}

async function ConsultarDatosCheques(cuil) {

    const respuestaCheques = await fetch(`https://api.bcra.gob.ar/CentralDeDeudores/v1.0/Deudas/ChequesRechazados/${cuil}`);
    return respuestaCheques;


}

async function manejoRespuesta(respuesta) {
    if (respuesta.status === 404) {
        return "sin-evidencia";

    }
    if (!respuesta.ok) {
        return "error del servidor";
    }

    const data = await respuesta.json();
    return data;
}

/*/index.html
/html/clientes.html
/css/styles.css
/js/
  ├─ main.js          ← orquestador (eventos + flujo)
  ├─ validations.js   ← validaciones de formulario
  ├─ bcraApi.js       ← fetch a la API del BCRA
  ├─ scoring.js       ← cálculo de score, alertas, categoría
  └─ persistence.js  ← LocalStorage + descarga JSON*/