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

// Actualizar dinero del usuario
app.post('/actualizar-dinero', async (req, res) => {
  const { userId, cantidad } = req.body;
  try {
      const result = await pool.query(
          'UPDATE usuarios SET dinero = dinero + $1 WHERE id = $2 RETURNING dinero',
          [cantidad, userId]
      );
      res.json({ dineroActual: result.rows[0].dinero });
  } catch (err) {
      console.error('Error al actualizar el dinero:', err);
      res.status(500).send('Error en el servidor');
  }
});

app.get('/dinero/:id_alumno', async (req, res) => {
  const idAlumno = req.params.id_alumno; // Obtener el id del alumno desde la URL
  try {
    const result = await pool.query('SELECT dinero FROM usuarios WHERE id_alumno = $1', [idAlumno]);
    if (result.rows.length > 0) {
      res.json({ dinero: result.rows[0].dinero });
    } else {
      res.status(404).json({ error: 'Alumno no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el dinero' });
  }
});

app.post('/add-dinero', async (req, res) => {
  const { id_alumno, cantidad } = req.body; // Obtener el id del alumno y la cantidad a añadir o restar
  try {
    const result = await pool.query(
      'UPDATE usuarios SET dinero = COALESCE(dinero, 0) + $1 WHERE id_alumno = $2',
      [cantidad, id_alumno]
    );
    
    if (result.rowCount > 0) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: 'Alumno no encontrado' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el dinero' });
  }
});

// Ruta para comprar un producto
app.post('/comprar', async (req, res) => {
  const { id_alumno, id_producto } = req.body;
  
  try {
      // Obtener el precio del producto
      const productoResult = await pool.query('SELECT precio FROM productos WHERE id_producto = $1', [id_producto]);
      if (productoResult.rows.length === 0) {
          return res.status(404).json({ error: 'Producto no encontrado' });
      }
      
      const precio = productoResult.rows[0].precio;

      // Obtener el saldo del alumno
      const saldoResult = await pool.query('SELECT dinero FROM usuarios WHERE id_alumno = $1', [id_alumno]);
      if (saldoResult.rows.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      const saldoActual = saldoResult.rows[0].dinero;

      // Verificar si el alumno tiene suficiente dinero
      if (saldoActual < precio) {
          return res.status(400).json({ error: 'Saldo insuficiente' });
      }

      // Restar el precio del saldo del alumno
      await pool.query('UPDATE usuarios SET dinero = dinero - $1 WHERE id_alumno = $2', [precio, id_alumno]);

      // Registrar la compra en una tabla de "compras" si quieres
      await pool.query('INSERT INTO compras (id_alumno, id_producto) VALUES ($1, $2)', [id_alumno, id_producto]);

      res.json({ success: true, nuevoSaldo: saldoActual - precio });
  } catch (err) {
      console.error('Error al realizar la compra:', err);
      res.status(500).json({ error: 'Error al realizar la compra' });
  }
});


// Ruta para obtener los productos de la tienda
app.get('/productos', async (req, res) => {
  try {
      const result = await pool.query('SELECT * FROM productos');
      res.json(result.rows); // Devolver todos los productos
  } catch (err) {
      console.error('Error al obtener los productos:', err);
      res.status(500).json({ error: 'Error al obtener los productos' });
  }
});

// Ruta para verificar si la respuesta es correcta
app.get('/verificar-respuesta/:id_respuesta', async (req, res) => {
  const idRespuesta = req.params.id_respuesta;

  try {
      const result = await pool.query(
          'SELECT escorrecta FROM respuestas WHERE id_respuesta = $1', 
          [idRespuesta]
      );
      
      if (result.rows.length > 0) {
          res.json({ escorrecta: result.rows[0].escorrecta });
      } else {
          res.status(404).json({ error: 'Respuesta no encontrada.' });
      }
  } catch (err) {
      console.error('Error al verificar la respuesta:', err);
      res.status(500).json({ error: 'Error al verificar la respuesta' });
  }
});

// Ruta para obtener preguntas y sus respuestas
app.get('/preguntas/:modulo', async (req, res) => {
  const modulo = req.params.modulo;

  try {
      // Obtener las preguntas y las respuestas asociadas
      const result = await pool.query(
          `SELECT p.id_pregunta, p.pregunta, r.id_respuesta, r.respuesta, r.escorrecta 
          FROM preguntas p 
          JOIN respuestas r ON p.id_pregunta = r.id_pregunta 
          WHERE p.modulo = $1`, 
          [modulo]
      );
      
      if (result.rows.length > 0) {
          res.json(result.rows); // Devuelve todas las preguntas con sus respuestas
      } else {
          res.status(404).json({ error: 'No se encontraron preguntas para este módulo.' });
      }
  } catch (err) {
      console.error('Error al obtener las preguntas:', err);
      res.status(500).json({ error: 'Error al obtener las preguntas y respuestas' });
  }
});



// Ruta para actualizar el progreso del módulo
// Ruta para actualizar el progreso del módulo
app.post('/completar-modulo', async (req, res) => {
  const { id_alumno, modulo } = req.body;

  try {
    // Verificar si el progreso ya existe
    const result = await pool.query(
      'SELECT * FROM progreso_modulos WHERE id_alumno = $1 AND modulo = $2',
      [id_alumno, modulo]
    );
    
    if (result.rows.length > 0) {
      // Si ya existe el registro, solo actualizamos a "completado"
      await pool.query(
        'UPDATE progreso_modulos SET completado = TRUE WHERE id_alumno = $1 AND modulo = $2',
        [id_alumno, modulo]
      );
    } else {
      // Si no existe, insertamos un nuevo registro
      await pool.query(
        'INSERT INTO progreso_modulos (id_alumno, modulo, completado) VALUES ($1, $2, TRUE)',
        [id_alumno, modulo]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar el progreso:', err);
    res.status(500).json({ error: 'Error al actualizar el progreso' });
  }
});


// Ruta para obtener el progreso de un alumno
app.get('/progreso/:id_alumno', async (req, res) => {
  const id_alumno = req.params.id_alumno;

  try {
    // Obtener todos los módulos completados del alumno
    const result = await pool.query(
      'SELECT modulo FROM progreso_modulos WHERE id_alumno = $1 AND completado = TRUE ORDER BY modulo ASC',
      [id_alumno]
    );
    res.json(result.rows); // Devuelve un arreglo con los módulos completados
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener el progreso' });
  }
});


  // Escuchar en el puerto definido
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });