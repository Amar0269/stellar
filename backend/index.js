require('dotenv').config(); // ✅ Must be first — loads env vars before any module reads them

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 8080;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(bodyParser.json());
app.use(cors());

// ── DB connections ──────────────────────────────────────────────────────────
require('./Models/db');            // auth-db (users)
require('./Models/complaintDb');   // complaint DB

// ── Routes ──────────────────────────────────────────────────────────────────
const AuthRouter      = require('./Routes/AuthRouter');
const ProductRouter   = require('./Routes/ProductRouter');
const SensorRouter    = require('./IoT/SensorRouter');
const AdminRouter     = require('./Routes/AdminRouter');
const ComplaintRouter = require('./Routes/ComplaintRouter');

app.use('/auth',       AuthRouter);
app.use('/products',   ProductRouter);
app.use('/api',        ProductRouter);        // existing RBAC example routes
app.use('/api/data',   SensorRouter);
app.use('/api/admin',  AdminRouter);          // admin panel routes
app.use('/api',        ComplaintRouter);      // complaint CRUD

// ── Seed default admin after auth-db connects ───────────────────────────────
const mongoose = require('mongoose');
const { seedAdmin } = require('./Controllers/AdminController');
mongoose.connection.once('open', () => {
    seedAdmin();
});

app.listen(PORT, () => {
    console.log(`Server is running on ${PORT}`);
});