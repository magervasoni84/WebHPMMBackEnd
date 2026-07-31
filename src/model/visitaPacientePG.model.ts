//Modelo de datos que se operan con la dB Postgres 

import { visitaVisitantePG } from "./visitaVisitantePG.model.js";

interface visitaPacientePG {
    idpaciente: number;   
    hab: number;
    cama: number;
    nombrePaciente: string;
    dni: number;
    ubicacion: string;
    observacion:string;
    alta: string;
    acompaniante:visitaVisitantePG[]
}

export { visitaPacientePG}