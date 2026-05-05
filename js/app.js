const STORAGE_KEY = "aplicacion-presupuesto-datos";
const STORAGE_VERSION = "3";

const ingresos = [
    new Ingreso("Salario", 2100),
    new Ingreso("Venta auto", 1500)
];

const egresos = [
    new Egreso("Renta", 900),
    new Egreso("Ropa", 400)
];

const formatoMoneda = valor => valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
});

const formatoPorcentaje = valor => valor.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 2
});

const totalIngresos = () => {
    let totalIngreso = 0;

    for (const ingreso of ingresos) {
        totalIngreso += ingreso.valor;
    }

    return totalIngreso;
};

const totalEgresos = () => {
    let totalEgreso = 0;

    for (const egreso of egresos) {
        totalEgreso += egreso.valor;
    }

    return totalEgreso;
};

const serializarColeccion = coleccion => coleccion.map(item => ({
    descripcion: item.descripcion,
    valor: item.valor
}));

const guardarDatos = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ingresos: serializarColeccion(ingresos),
        egresos: serializarColeccion(egresos)
    }));
    localStorage.setItem(`${STORAGE_KEY}-version`, STORAGE_VERSION);
};

const reemplazarColeccion = (destino, datosBase, Clase) => {
    destino.length = 0;

    for (const item of datosBase) {
        destino.push(new Clase(item.descripcion, item.valor));
    }
};

const cargarDatosGuardados = () => {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);
    const versionGuardada = localStorage.getItem(`${STORAGE_KEY}-version`);

    if (!datosGuardados || versionGuardada !== STORAGE_VERSION) {
        guardarDatos();
        return;
    }

    try {
        const datos = JSON.parse(datosGuardados);

        Ingreso.reiniciarContador();
        Egreso.reiniciarContador();
        reemplazarColeccion(ingresos, datos.ingresos || [], Ingreso);
        reemplazarColeccion(egresos, datos.egresos || [], Egreso);
    } catch (error) {
        Ingreso.reiniciarContador();
        Egreso.reiniciarContador();
        reemplazarColeccion(ingresos, [
            { descripcion: "Salario", valor: 2100 },
            { descripcion: "Venta auto", valor: 1500 }
        ], Ingreso);
        reemplazarColeccion(egresos, [
            { descripcion: "Renta", valor: 900 },
            { descripcion: "Ropa", valor: 400 }
        ], Egreso);
        guardarDatos();
    }
};

const mostrarFecha = () => {
    const fecha = new Date().toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric"
    });
    document.querySelector(".presupuesto_titulo--mes").innerHTML = fecha;
};

const cargarCabecero = () => {
    const presupuesto = totalIngresos() - totalEgresos();
    const porcentajeEgreso = totalIngresos() > 0
        ? totalEgresos() / totalIngresos()
        : 0;

    document.getElementById("presupuesto").innerHTML = formatoMoneda(presupuesto);
    document.getElementById("porcentaje").innerHTML = totalIngresos() > 0
        ? formatoPorcentaje(porcentajeEgreso)
        : "---";
    document.getElementById("ingresos").innerHTML = formatoMoneda(totalIngresos());
    document.getElementById("egresos").innerHTML = formatoMoneda(totalEgresos());
};

const crearIngresoHTML = ingreso => {
    const ingresoHTML = `
        <div class="elemento limpiarEstilos">
            <div class="elemento_descripcion">${ingreso.descripcion}</div>
            <div class="derecha limpiarEstilos">
                <div class="elemento_valor">+ ${formatoMoneda(ingreso.valor)}</div>
                <div class="elemento_eliminar">
                    <button class="elemento_eliminar--btn" aria-label="Eliminar ingreso">
                        <ion-icon name="close-circle-outline" onclick="eliminarIngreso(${ingreso.id})"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `;

    return ingresoHTML;
};

const cargarIngresos = () => {
    let ingresosHTML = "";

    for (const ingreso of ingresos) {
        ingresosHTML += crearIngresoHTML(ingreso);
    }

    document.getElementById("lista-ingresos").innerHTML = ingresosHTML;
};

const crearEgresoHTML = egreso => {
    egreso.calcularPorcentaje(totalIngresos());

    const egresoHTML = `
        <div class="elemento limpiarEstilos">
            <div class="elemento_descripcion">${egreso.descripcion}</div>
            <div class="derecha limpiarEstilos">
                <div class="elemento_valor">- ${formatoMoneda(egreso.valor)}</div>
                <div class="elemento_porcentaje">${egreso.getPorcentaje() > 0 ? `${egreso.getPorcentaje()}%` : "---"}</div>
                <div class="elemento_eliminar">
                    <button class="elemento_eliminar--btn" aria-label="Eliminar egreso">
                        <ion-icon name="close-circle-outline" onclick="eliminarEgreso(${egreso.id})"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `;

    return egresoHTML;
};

const cargarEgresos = () => {
    let egresosHTML = "";

    for (const egreso of egresos) {
        egresosHTML += crearEgresoHTML(egreso);
    }

    document.getElementById("lista-egresos").innerHTML = egresosHTML;
};

const eliminarIngreso = id => {
    const indiceEliminar = ingresos.findIndex(ingreso => ingreso.id === id);

    if (indiceEliminar >= 0) {
        ingresos.splice(indiceEliminar, 1);
        guardarDatos();
        cargarApp();
    }
};

const eliminarEgreso = id => {
    const indiceEliminar = egresos.findIndex(egreso => egreso.id === id);

    if (indiceEliminar >= 0) {
        egresos.splice(indiceEliminar, 1);
        guardarDatos();
        cargarApp();
    }
};

const limpiarCampos = () => {
    document.getElementById("descripcion").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("descripcion").focus();
};

const agregarDato = () => {
    const forma = document.forms.forma;
    const tipo = forma.tipo.value;
    const descripcion = forma.descripcion.value.trim();
    const valor = Number.parseFloat(forma.valor.value);

    if (!descripcion || Number.isNaN(valor) || valor <= 0) {
        return false;
    }

    if (tipo === "ingreso") {
        ingresos.push(new Ingreso(descripcion, valor));
    } else {
        egresos.push(new Egreso(descripcion, valor));
    }

    guardarDatos();
    cargarApp();
    limpiarCampos();
    return false;
};

const cambiarTipo = () => {
    document.getElementById("tipo").classList.toggle("rojofocus");
    document.getElementById("descripcion").classList.toggle("rojofocus");
    document.getElementById("valor").classList.toggle("rojofocus");
    document.getElementById("btnAgregar").classList.toggle("rojo");
};

const cargarApp = () => {
    mostrarFecha();
    cargarCabecero();
    cargarIngresos();
    cargarEgresos();
};

cargarDatosGuardados();

window.totalIngresos = totalIngresos;
window.totalEgresos = totalEgresos;
window.cargarCabecero = cargarCabecero;
window.cargarIngresos = cargarIngresos;
window.cargarEgresos = cargarEgresos;
window.cargarApp = cargarApp;
window.agregarDato = agregarDato;
window.eliminarIngreso = eliminarIngreso;
window.eliminarEgreso = eliminarEgreso;
window.cambiarTipo = cambiarTipo;
