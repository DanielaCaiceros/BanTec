const express = require('express');
const path = require('path');
const { Pool } = require('pg'); // Importa el módulo pg

const app = express();
const PORT = 3006;

// Middleware para procesar el cuerpo de las solicitudes POST (para datos JSON o form-data)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  user: 'postgres',      // Reemplaza con tu nombre de usuario de PostgreSQL
  host: 'localhost',       // La dirección del servidor (localhost si está en tu máquina)
  database: 'BanTec',      // El nombre de la base de datos que creaste en PostgreSQL
  password: 'mello',// La contraseña del usuario
  port: 5433,              // El puerto por defecto de PostgreSQL
});

// Prueba de la conexión a la base de datos
pool.connect((err, client, release) => {
    if (err) {
      return console.error('Error al conectar con la base de datos:', err.stack);
    }
    console.log('Conectado a la base de datos PostgreSQL');
    release();
  });
  
  // Servir archivos estáticos desde la carpeta 'public'
  app.use(express.static(path.join(__dirname, 'public')));
  
  // Ruta para servir el index.html
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
  
  // Ruta para manejar el login
  app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body; // Asegúrate de que los nombres coincidan con los campos en tu formulario HTML
  
    pool.query(
      'SELECT * FROM usuarios WHERE correo = $1 AND contraseña = $2',
      [correo, contraseña],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).send('Error en el servidor');
        } else if (result.rows.length > 0) {
          // Si las credenciales son correctas, redirige a homepage.html
          res.redirect('/homepage.html');
        } else {
          // Si las credenciales son incorrectas, devuelve un mensaje de error
          res.send('Usuario o contraseña incorrectos');
        }
      }
    );
  });
  
  // Servir la página de inicio después de iniciar sesión correctamente
  app.get('/homepage.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'homepage.html'));
  });

  
// Ruta para obtener las preguntas y respuestas de un módulo específico
app.get('/preguntas/:modulo', async (req, res) => {
    const modulo = req.params.modulo;
  
    try {
      const result = await pool.query(`
        SELECT p.id_pregunta, p.pregunta, r.id_respuesta, r.respuesta, r.esCorrecta
        FROM preguntas p
        JOIN respuestas r ON p.id_pregunta = r.id_pregunta
        WHERE p.modulo = $1
      `, [modulo]);
  
      res.json(result.rows); // Devuelve las preguntas y respuestas en formato JSON
    } catch (err) {
      console.error(err);
      res.status(500).send('Error al obtener preguntas');
    }
  });
  // Escuchar en el puerto definido
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });