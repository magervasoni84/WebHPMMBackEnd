# Node.js PostgreSQL / MSSQL REST API

## Estado actual (notas heredadas)

postgresql  
User: postgres  
Pass: postgres  

NO funciona  
dbhpmm  
User: pgdev  
Pass: postgres  

SI funciona  
psql -U postgres -d dbhpmm -h localhost  
dbhpmm  
User: postgres  
Pass: postgres  

---

## Ejecución local

```bash
npm install
npm run dev
```

o:

```bash
npm start
```

> `package.json` usa `"type": "module"`.

---

## Variables de entorno (`.env` en la raíz del proyecto)

Crear un archivo `.env` en la raíz (`WebHPMMBackEnd/.env`) con valores como:

```env
# App
NODE_ENV=development
PORT=5002

# PostgreSQL
PG_USER=postgres
PG_PASSWORD=postgres
PG_HOST=localhost
PG_DATABASE=dbhpmm
PG_PORT=5432

# SQL Server
MSSQL_USER=sa
MSSQL_PASSWORD=yourStrong(!)Password
MSSQL_SERVER=localhost
MSSQL_DATABASE=tu_db
MSSQL_ENCRYPT=false
MSSQL_TRUST_CERT=true
```

---

## Deploy (producción)

### 1) Preparar entorno
- Instalar dependencias:
  ```bash
  npm cli
  ```
- Definir variables de entorno de producción en el servidor/plataforma (NO commitear `.env`).

### 2) Variables mínimas requeridas
- `NODE_ENV=production`
- `PORT` (si la plataforma lo define automáticamente, respetar ese valor)
- Variables DB usadas por el backend:
  - PostgreSQL: `PG_USER`, `PG_PASSWORD`, `PG_HOST`, `PG_DATABASE`, `PG_PORT`
  - SQL Server: `MSSQL_USER`, `MSSQL_PASSWORD`, `MSSQL_SERVER`, `MSSQL_DATABASE`, `MSSQL_ENCRYPT`, `MSSQL_TRUST_CERT`

### 3) Frontend integrado (si aplica)
El backend, en producción, intenta servir estáticos desde:

`../HPMMWebFront/dist` (relativo a `src/`)

Asegurar que el build del frontend exista en esa ruta antes de iniciar el backend.

### 4) Arranque en producción
```bash
npm start
```

---


## Dependencias utilizadas

```bash
npm install express pg mssql cors dotenv
