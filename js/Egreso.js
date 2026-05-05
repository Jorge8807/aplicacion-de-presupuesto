class Egreso extends Dato {
    static contadorEgresos = 0;

    constructor(descripcion, valor) {
        super(descripcion, valor);
        this._id = ++Egreso.contadorEgresos;
        this._porcentaje = -1;
    }

    get id() {
        return this._id;
    }

    calcularPorcentaje(ingresoTotal) {
        if (ingresoTotal > 0) {
            this._porcentaje = Math.round((this.valor / ingresoTotal) * 100);
            return;
        }

        this._porcentaje = -1;
    }

    getPorcentaje() {
        return this._porcentaje;
    }

    static reiniciarContador() {
        Egreso.contadorEgresos = 0;
    }
}
