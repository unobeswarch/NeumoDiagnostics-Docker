--CREATE DATABASE blogic_db;


CREATE TABLE usuarios (
   id SERIAL PRIMARY KEY,
   nombre_completo VARCHAR(255) NOT NULL,
   edad INT NOT NULL,
   rol VARCHAR(255) NOT NULL,
   identificacion VARCHAR(50) UNIQUE NOT NULL,
   correo VARCHAR(255) UNIQUE NOT NULL,
   contrasena VARCHAR(255) NOT NULL,
   acepta_tratamiento_datos BOOLEAN NOT NULL,
   fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


--select * from usuarios;