const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Servir archivos estáticos (HTML, CSS, JS) desde la carpeta 'public'
app.use(express.static(path.join(__dirname, 'public')));

<<<<<<< Updated upstream
// Ruta para servir el index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
=======
// Configuración de la conexión a la base de datos PostgreSQL
const pool = new Pool({
  user: 'postgres',      // Reemplaza con tu nombre de usuario de PostgreSQL
  host: 'localhost',       // La dirección del servidor (localhost si está en tu máquina)
  database: 'BanTec',      // El nombre de la base de datos que creaste en PostgreSQL
  password: 'admin',  // La contraseña del usuario
  port: 5432,              // El puerto por defecto de PostgreSQL
>>>>>>> Stashed changes
});

// Escuchar en el puerto definido
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
