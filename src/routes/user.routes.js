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

router.post('/users', async (req, res) => {
    const data = req.body;
    const {rows} = await pool.query('INSERT INTO users (name, email) VALUES ($1, $2) RETURNING *', 
        [data.name, data.email])

    return res.sendStatus(202)

})


router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { rows, rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (rowCount === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" })
    }
    return res.json({ message: "Usuario eliminado correctamente" })
    console.log(row);
    res.send('Eliminando usuario: ' + id);
})

router.put('/users/:id', async(req, res) => {
    const { id } = req.params;
    const data = req.body;
    const result = await pool.query('UPDATE users SET name = $1, email = $2 WHERE id = $3',[data.name, data.email, id])
    console.log(result)
    res.send('Actualizando usuario: ' + id);
})


export default router;