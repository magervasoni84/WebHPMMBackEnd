import { Router } from 'express';
import { pool } from '../config/configDB.js';



const router = Router();

router.get('/users', async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM users');
    console.log(rows);
    res.json(rows)
})

router.get('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" })
    }
    res.json(rows)
})

router.post('/users', (req, res) => {
    const { id } = req.params;
    res.send('Creando usuarios: ' + id);
})

router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { rows, rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (rows.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" })
    }
    console.log(row);
    res.send('Eliminando usuario: ' + id);
})

router.put('/users/:id', (req, res) => {
    const { id } = req.params;
    res.send('Actualizando usuario: ' + id);
})


export default router;