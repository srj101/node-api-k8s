const express = require('express');
   const mysql = require('mysql2/promise');
   const app = express();
   const port = 3000;

   app.use(express.json());

   // MySQL connection configuration
   const dbConfig = {
     host: process.env.MYSQL_HOST || 'mysql-service',
     user: process.env.MYSQL_USER || 'root',
     password: process.env.MYSQL_PASSWORD || 'password',
     database: process.env.MYSQL_DATABASE || 'mydb',
   };

   // Initialize database and create table
   async function initializeDb() {
     const connection = await mysql.createConnection({ ...dbConfig, database: null });
     await connection.query('CREATE DATABASE IF NOT EXISTS mydb');
     await connection.query('USE mydb');
     await connection.query(`
       CREATE TABLE IF NOT EXISTS users (
         id INT AUTO_INCREMENT PRIMARY KEY,
         name VARCHAR(255) NOT NULL,
         email VARCHAR(255) NOT NULL
       )
     `);
     await connection.end();
   }

   // GET all users
   app.get('/users', async (req, res) => {
     try {
       const connection = await mysql.createConnection(dbConfig);
       const [rows] = await connection.query('SELECT * FROM users');
       await connection.end();
       res.json(rows);
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   // POST a new user
   app.post('/users', async (req, res) => {
     const { name, email } = req.body;
     if (!name || !email) {
       return res.status(400).json({ error: 'Name and email are required' });
     }
     try {
       const connection = await mysql.createConnection(dbConfig);
       const [result] = await connection.query('INSERT INTO users (name, email) VALUES (?, ?)', [name, email]);
       await connection.end();
       res.status(201).json({ id: result.insertId, name, email });
     } catch (error) {
       res.status(500).json({ error: error.message });
     }
   });

   // Initialize database and start server
   initializeDb().then(() => {
     app.listen(port, () => {
       console.log(`API running at http://localhost:${port}`);
     });
   }).catch(err => {
     console.error('Failed to initialize database:', err);
   });