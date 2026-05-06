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

    calcularPorcentaje(ingresoTotal, egresoTotal = 0) {
        if (ingresoTotal > 0) {
            this._porcentaje = this.valor / ingresoTotal;
            return;
        }

        if (egresoTotal > 0) {
            this._porcentaje = this.valor / egresoTotal;
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
