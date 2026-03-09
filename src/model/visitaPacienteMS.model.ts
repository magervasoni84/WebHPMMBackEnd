//Modelo de datos que vienen de data source de MS SQL Server

interface visitaPacienteMS {
    idpaciente: number;   
    hab: number;
    cama: number;
    nombrePaciente: string;
    dni: number;
    ubicacion: string;
    alta: string;
}


export { visitaPacienteMS}