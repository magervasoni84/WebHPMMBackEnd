import mssql from 'mssql';
import { getMsPool } from '../config/configDBms.js';







export async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'username y password son requeridos' });
    }

    const msPool = await getMsPool();
    const request = msPool.request();
    let passDesencriptado
    request.input('username', mssql.VarChar(10), username);
    passDesencriptado = desencriptarPassword(password);
    request.input('passDesencriptado', mssql.VarChar(18), passDesencriptado);


    const query = `
      SELECT OPE,NOM,PRF,OBS,MAI from SYSOPE
      WHERE OPE = @username
        AND PWD = @passDesencriptado
    `;

    const { recordset } = await request.query(query);


    if (!recordset || recordset.length === 0) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    return res.json({ success: true, usuario: recordset });
  } catch (error) {
    console.error('Error en auth login:', error);
    return res.status(500).json({ error: 'Error interno al realizar login' });
  }
}





function desencriptarPassword(pass) {
  // Asegurar que sea string
  pass = String(pass);

  // Para 8 caracteres funciona 
  // Paso 1: si longitud < 6, rellenar con espacios hasta 6
  if (pass.length < 6) {
    pass = pass.padEnd(6, ' ');
  }
  // Paso 2: asegurar que la longitud sea múltiplo de 6
  const resto = pass.length % 6;
  if (resto !== 0) {
    const padding = 6 - resto;
    pass = pass.padEnd(pass.length + padding, ' ');
  }

  let passDesencriptado = '';
  // Paso 3: Le sumamos a cada caracter su posición (empezando en 0) y restamos 19
  try {
    for (let i = 0; i < pass.length; i++) {
      const resta = 19 - i;
      const original = pass.charCodeAt(i);
      const modificado = original - resta;
      passDesencriptado += String.fromCharCode(modificado);
    }

    //const hex = Buffer.from(passDesencriptado, 'utf8').toString('hex');
    //console.log('passDesencriptado en hex:', hex);



    // Si la longitud está entre 6 y 11, rellenar hasta 12
    if (passDesencriptado.length > 6 && passDesencriptado.length < 12) {
      passDesencriptado = passDesencriptado.padEnd(12, ' ');
    }
  } catch (error) {
    throw new Error('Error al desencriptar: ' + error.message);
  }

  return passDesencriptado;
}