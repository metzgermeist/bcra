function obtenerClientes() {
    return JSON.parse(localStorage.getItem("clientes")) || [];
}

function guardarCliente(cliente) {
    const clientes = obtenerClientes();
    clientes.push(cliente);
    localStorage.setItem("clientes", JSON.stringify(clientes));
    return "EXITO";
}

function eliminarCliente(cuilaborrar) {
    const clientes = obtenerClientes();
    const objetivo = String(cuilaborrar || "").replace(/\D/g, "");
    const clientesActualizados = clientes.filter(c => {
        const datos = c && c.datosPersonales ? c.datosPersonales : {};
        const actual = String(datos.cuit || datos.cuil || "").replace(/\D/g, "");
        return actual !== objetivo;
    });
    localStorage.setItem("clientes", JSON.stringify(clientesActualizados));
    return "EXITO";
}
