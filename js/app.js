const STORAGE_KEY = "aplicacion-presupuesto-datos";
const STORAGE_VERSION = "3";
const DATOS_INICIALES = {
    ingresos: [],
    egresos: []
};
let edicionActiva = null;

const ingresos = [];

const egresos = [];

const formatoMoneda = valor => valor.toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2
});

const formatoMonedaConSigno = valor => {
    const signo = valor < 0 ? "-" : "+";
    return `${signo} ${formatoMoneda(Math.abs(valor))}`;
};

const formatoMonedaPresupuesto = valor => {
    const signo = valor < 0 ? "-" : "";
    return `${signo}${signo ? " " : ""}${formatoMoneda(Math.abs(valor))}`;
};

const formatoMonedaEgreso = valor => {
    const signo = valor > 0 ? "-" : "";
    return `${signo}${signo ? " " : ""}${formatoMoneda(Math.abs(valor))}`;
};

const formatoPorcentaje = valor => valor.toLocaleString("es-MX", {
    style: "percent",
    minimumFractionDigits: 2
});

const obtenerPorcentajeTotalEgresos = (ingresosTotales, egresosTotales) => {
    if (ingresosTotales === 0 && egresosTotales === 0) {
        return 0;
    }

    if (ingresosTotales > 0) {
        return egresosTotales / ingresosTotales;
    }

    if (egresosTotales > 0) {
        return 1;
    }

    return -1;
};

const obtenerPorcentajeDisponible = (presupuesto, ingresosTotales) => {
    if (ingresosTotales <= 0) {
        return 0;
    }

    return presupuesto / ingresosTotales;
};

const escaparHTML = texto => String(texto)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

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

const restaurarDatosIniciales = () => {
    Ingreso.reiniciarContador();
    Egreso.reiniciarContador();
    reemplazarColeccion(ingresos, DATOS_INICIALES.ingresos, Ingreso);
    reemplazarColeccion(egresos, DATOS_INICIALES.egresos, Egreso);
    guardarDatos();
};

const cargarDatosGuardados = () => {
    const datosGuardados = localStorage.getItem(STORAGE_KEY);
    const versionGuardada = localStorage.getItem(`${STORAGE_KEY}-version`);

    if (!datosGuardados || versionGuardada !== STORAGE_VERSION) {
        restaurarDatosIniciales();
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
        restaurarDatosIniciales();
    }
};

const mostrarFecha = () => {
    const fecha = new Date().toLocaleDateString("es-MX", {
        month: "long",
        year: "numeric"
    });
    const fechaCapitalizada = fecha.charAt(0).toUpperCase() + fecha.slice(1);
    document.querySelector(".presupuesto_titulo--mes").innerHTML = fechaCapitalizada;
};

const mostrarMensajeFormulario = (mensaje, tipo = "") => {
    const elementoMensaje = document.getElementById("formulario-mensaje");
    elementoMensaje.textContent = mensaje;
    elementoMensaje.className = `formulario_mensaje${tipo ? ` ${tipo}` : ""}`;
};

const cargarCabecero = () => {
    const ingresosTotales = totalIngresos();
    const egresosTotales = totalEgresos();
    const presupuesto = ingresosTotales - egresosTotales;
    const porcentajeTotalEgresos = obtenerPorcentajeTotalEgresos(ingresosTotales, egresosTotales);
    const porcentajeDisponible = obtenerPorcentajeDisponible(presupuesto, ingresosTotales);
    const porcentajeEgresoHTML = porcentajeTotalEgresos >= 0
        ? formatoPorcentaje(porcentajeTotalEgresos)
        : "---";

    document.getElementById("presupuesto").innerHTML = formatoMonedaPresupuesto(presupuesto);
    document.getElementById("presupuesto-resumen").innerHTML = `Disponible: ${formatoPorcentaje(porcentajeDisponible)} de tus ingresos`;
    document.getElementById("porcentaje").innerHTML = porcentajeEgresoHTML;
    document.getElementById("ingresos").innerHTML = formatoMonedaConSigno(ingresosTotales);
    document.getElementById("egresos").innerHTML = formatoMonedaEgreso(egresosTotales);
};

const estaEditando = (tipo, id) => edicionActiva && edicionActiva.tipo === tipo && edicionActiva.id === id;

const crearFormularioEdicionHTML = (tipo, movimiento) => {
    const prefijo = tipo === "ingreso" ? "+" : "-";
    const descripcionSegura = escaparHTML(movimiento.descripcion);
    const porcentajeHTML = tipo === "egreso"
        ? `<div class="elemento_porcentaje">${movimiento.getPorcentaje() > 0 ? formatoPorcentaje(movimiento.getPorcentaje()) : "---"}</div>`
        : "";

    return `
        <div class="elemento limpiarEstilos elemento_edicion">
            <div class="elemento_formulario">
                <label class="visualmente_oculto" for="editar-descripcion-${tipo}-${movimiento.id}">Editar descripción</label>
                <input
                    class="elemento_input"
                    id="editar-descripcion-${tipo}-${movimiento.id}"
                    type="text"
                    value="${descripcionSegura}"
                >
                <div class="derecha limpiarEstilos">
                    <div class="elemento_valor">${formatoMonedaConSigno(prefijo === "+" ? movimiento.valor : -movimiento.valor)}</div>
                    ${porcentajeHTML}
                </div>
            </div>
            <div class="elemento_formulario elemento_formulario--acciones">
                <label class="visualmente_oculto" for="editar-valor-${tipo}-${movimiento.id}">Editar valor</label>
                <input
                    class="elemento_input elemento_input--valor"
                    id="editar-valor-${tipo}-${movimiento.id}"
                    type="number"
                    step="any"
                    min="0"
                    value="${movimiento.valor}"
                >
                <div class="elemento_acciones elemento_acciones--edicion">
                    <button class="elemento_guardar--btn" type="button" data-accion="guardar" data-tipo="${tipo}" data-id="${movimiento.id}">Guardar</button>
                    <button class="elemento_cancelar--btn" type="button" data-accion="cancelar" data-tipo="${tipo}" data-id="${movimiento.id}">Cancelar</button>
                </div>
            </div>
        </div>
    `;
};

const crearIngresoHTML = ingreso => {
    if (estaEditando("ingreso", ingreso.id)) {
        return crearFormularioEdicionHTML("ingreso", ingreso);
    }

    const descripcionSegura = escaparHTML(ingreso.descripcion);

    const ingresoHTML = `
        <div class="elemento limpiarEstilos">
            <div class="elemento_descripcion">${descripcionSegura}</div>
            <div class="derecha limpiarEstilos">
                <div class="elemento_valor">${formatoMonedaConSigno(ingreso.valor)}</div>
                <div class="elemento_acciones">
                    <button class="elemento_editar--btn" type="button" title="Editar ingreso" aria-label="Editar ingreso ${descripcionSegura}" data-accion="editar" data-tipo="ingreso" data-id="${ingreso.id}">
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                    <button class="elemento_eliminar--btn" type="button" title="Eliminar ingreso" aria-label="Eliminar ingreso ${descripcionSegura}" data-accion="eliminar" data-tipo="ingreso" data-id="${ingreso.id}">
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `;

    return ingresoHTML;
};

const cargarIngresos = () => {
    const contenedorIngresos = document.getElementById("lista-ingresos");

    if (ingresos.length === 0) {
        contenedorIngresos.innerHTML = '<div class="lista_vacia">No hay ingresos registrados. Agrega uno desde el formulario.</div>';
        return;
    }

    let ingresosHTML = "";

    for (const ingreso of ingresos) {
        ingresosHTML += crearIngresoHTML(ingreso);
    }

    contenedorIngresos.innerHTML = ingresosHTML;
};

const crearEgresoHTML = egreso => {
    egreso.calcularPorcentaje(totalIngresos(), totalEgresos());

    if (estaEditando("egreso", egreso.id)) {
        return crearFormularioEdicionHTML("egreso", egreso);
    }

    const descripcionSegura = escaparHTML(egreso.descripcion);

    const egresoHTML = `
        <div class="elemento limpiarEstilos">
            <div class="elemento_descripcion">${descripcionSegura}</div>
            <div class="derecha limpiarEstilos">
                <div class="elemento_valor">${formatoMonedaConSigno(-egreso.valor)}</div>
                <div class="elemento_porcentaje">${egreso.getPorcentaje() > 0 ? formatoPorcentaje(egreso.getPorcentaje()) : "---"}</div>
                <div class="elemento_acciones">
                    <button class="elemento_editar--btn" type="button" title="Editar egreso" aria-label="Editar egreso ${descripcionSegura}" data-accion="editar" data-tipo="egreso" data-id="${egreso.id}">
                        <ion-icon name="create-outline"></ion-icon>
                    </button>
                    <button class="elemento_eliminar--btn" type="button" title="Eliminar egreso" aria-label="Eliminar egreso ${descripcionSegura}" data-accion="eliminar" data-tipo="egreso" data-id="${egreso.id}">
                        <ion-icon name="close-circle-outline"></ion-icon>
                    </button>
                </div>
            </div>
        </div>
    `;

    return egresoHTML;
};

const cargarEgresos = () => {
    const contenedorEgresos = document.getElementById("lista-egresos");

    if (egresos.length === 0) {
        contenedorEgresos.innerHTML = '<div class="lista_vacia">No hay egresos registrados. Agrega uno desde el formulario.</div>';
        return;
    }

    let egresosHTML = "";

    for (const egreso of egresos) {
        egresosHTML += crearEgresoHTML(egreso);
    }

    contenedorEgresos.innerHTML = egresosHTML;
};

const eliminarIngreso = id => {
    const indiceEliminar = ingresos.findIndex(ingreso => ingreso.id === id);

    if (indiceEliminar >= 0 && window.confirm("¿Deseas eliminar este ingreso?")) {
        ingresos.splice(indiceEliminar, 1);
        edicionActiva = null;
        guardarDatos();
        cargarApp();
        mostrarMensajeFormulario("Ingreso eliminado correctamente.", "exito");
    }
};

const editarMovimiento = (tipo, id) => {
    edicionActiva = { tipo, id };
    cargarApp();
    const inputDescripcion = document.getElementById(`editar-descripcion-${tipo}-${id}`);

    if (inputDescripcion) {
        inputDescripcion.focus();
        inputDescripcion.select();
    }
};

const eliminarEgreso = id => {
    const indiceEliminar = egresos.findIndex(egreso => egreso.id === id);

    if (indiceEliminar >= 0 && window.confirm("¿Deseas eliminar este egreso?")) {
        egresos.splice(indiceEliminar, 1);
        edicionActiva = null;
        guardarDatos();
        cargarApp();
        mostrarMensajeFormulario("Egreso eliminado correctamente.", "exito");
    }
};

const cancelarEdicion = () => {
    edicionActiva = null;
    cargarApp();
    mostrarMensajeFormulario("Edición cancelada.", "");
};

const guardarEdicion = (tipo, id) => {
    const coleccion = tipo === "ingreso" ? ingresos : egresos;
    const movimiento = coleccion.find(item => item.id === id);

    if (!movimiento) {
        return;
    }

    const inputDescripcion = document.getElementById(`editar-descripcion-${tipo}-${id}`);
    const inputValor = document.getElementById(`editar-valor-${tipo}-${id}`);
    const descripcion = inputDescripcion.value.trim();
    const valor = Number.parseFloat(inputValor.value);

    if (!descripcion) {
        mostrarMensajeFormulario("La descripción no puede estar vacía.", "error");
        inputDescripcion.focus();
        return;
    }

    if (Number.isNaN(valor) || valor <= 0) {
        mostrarMensajeFormulario("El valor editado debe ser mayor a cero.", "error");
        inputValor.focus();
        return;
    }

    movimiento.descripcion = descripcion;
    movimiento.valor = valor;
    edicionActiva = null;
    guardarDatos();
    cargarApp();
    mostrarMensajeFormulario("Movimiento actualizado correctamente.", "exito");
};

const manejarTecladoEdicion = evento => {
    const inputEdicion = evento.target.closest(".elemento_input");

    if (!inputEdicion || !edicionActiva) {
        return;
    }

    if (evento.key === "Enter") {
        evento.preventDefault();
        guardarEdicion(edicionActiva.tipo, edicionActiva.id);
        return;
    }

    if (evento.key === "Escape") {
        evento.preventDefault();
        cancelarEdicion();
    }
};

const limpiarCampos = () => {
    document.getElementById("descripcion").value = "";
    document.getElementById("valor").value = "";
    document.getElementById("descripcion").focus();
};

const agregarDato = evento => {
    if (evento) {
        evento.preventDefault();
    }

    const forma = document.forms.forma;
    const tipo = forma.tipo.value;
    const descripcion = forma.descripcion.value.trim();
    const valor = Number.parseFloat(forma.valor.value);

    if (!descripcion || Number.isNaN(valor) || valor <= 0) {
        mostrarMensajeFormulario("Escribe una descripción y un valor mayor a cero.", "error");
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
    mostrarMensajeFormulario("Movimiento agregado correctamente.", "exito");
    return false;
};

const cambiarTipo = () => {
    document.getElementById("tipo").classList.toggle("rojofocus");
    document.getElementById("descripcion").classList.toggle("rojofocus");
    document.getElementById("valor").classList.toggle("rojofocus");
    document.getElementById("btnAgregar").classList.toggle("rojo");
};

const reiniciarDatos = () => {
    restaurarDatosIniciales();
    edicionActiva = null;
    cargarApp();
    mostrarMensajeFormulario("Datos reiniciados correctamente.", "exito");
};

const cargarApp = () => {
    mostrarFecha();
    cargarCabecero();
    cargarIngresos();
    cargarEgresos();
};

const manejarEliminacion = evento => {
    const botonEliminar = evento.target.closest("button[data-accion][data-tipo][data-id]");

    if (!botonEliminar) {
        return;
    }

    if (botonEliminar.dataset.accion === "editar") {
        editarMovimiento(botonEliminar.dataset.tipo, Number.parseInt(botonEliminar.dataset.id, 10));
        return;
    }

    if (botonEliminar.dataset.accion === "guardar") {
        guardarEdicion(botonEliminar.dataset.tipo, Number.parseInt(botonEliminar.dataset.id, 10));
        return;
    }

    if (botonEliminar.dataset.accion === "cancelar") {
        cancelarEdicion();
        return;
    }

    if (botonEliminar.dataset.accion === "eliminar") {
        const id = Number.parseInt(botonEliminar.dataset.id, 10);

        if (botonEliminar.dataset.tipo === "ingreso") {
            eliminarIngreso(id);
            return;
        }

        eliminarEgreso(id);
        return;
    }

    const id = Number.parseInt(botonEliminar.dataset.id, 10);
};

const configurarEventos = () => {
    document.getElementById("forma").addEventListener("submit", agregarDato);
    document.getElementById("tipo").addEventListener("change", cambiarTipo);
    document.getElementById("btnReiniciar").addEventListener("click", reiniciarDatos);
    document.getElementById("lista-ingresos").addEventListener("click", manejarEliminacion);
    document.getElementById("lista-egresos").addEventListener("click", manejarEliminacion);
    document.getElementById("lista-ingresos").addEventListener("keydown", manejarTecladoEdicion);
    document.getElementById("lista-egresos").addEventListener("keydown", manejarTecladoEdicion);
};

cargarDatosGuardados();
document.addEventListener("DOMContentLoaded", () => {
    configurarEventos();
    cargarApp();
});

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
window.reiniciarDatos = reiniciarDatos;
window.editarMovimiento = editarMovimiento;
