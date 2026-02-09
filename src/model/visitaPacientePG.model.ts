//Modelo de datos que se guardan/obtienen Postgres 

import { visitaVisitantePG } from "./visitaVisitantePG.model";

interface visitaPacientePG {
    idpaciente: number;   
    hab: number;
    cama: number;
    nombrePaciente: string;
    dni: number;
    ubicacion: string;
    observacion:string;
    acompaniante:visitaVisitantePG[]
}

export { visitaPacientePG}