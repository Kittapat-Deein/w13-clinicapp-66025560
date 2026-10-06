import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import { randomBytes } from 'crypto';
import { getSqlPool } from './db.js';

function generateToken() {
  return randomBytes(32).toString('hex'); // 64-char hex token
}

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => res.json({ ok: true, service: 'whiskey-reservation-api' }));

// Helper to get whiskeys list
async function getWhiskeysList() {
  const pool = await getSqlPool();
  const r = await pool.request().query(`
    SELECT id, name, category, origin, description, price, icon,
           category AS specialty
    FROM whiskeys
    ORDER BY id
  `);
  return r.recordset;
}

// Helper to get orders list
async function getOrdersList() {
  const pool = await getSqlPool();
  const r = await pool.request().query(`
    SELECT o.id, o.whiskey_id, o.whiskey_name, o.customer_name, o.phone, o.reservation_time, o.quantity, o.created,
           w.price, w.icon, w.origin, w.category,
           o.customer_name AS patient_name,
           o.reservation_time AS slot,
           o.whiskey_name AS doctor_name,
           w.category AS specialty
    FROM whiskey_orders o
    JOIN whiskeys w ON o.whiskey_id = w.id
    ORDER BY o.reservation_time DESC
  `);
  return r.recordset;
}

// GET Whiskeys (New endpoint & legacy /doctors alias)
app.get('/whiskeys', async (_req, res, next) => {
  try {
    const list = await getWhiskeysList();
    res.json(list);
  } catch (e) { next(e); }
});

app.get('/doctors', async (_req, res, next) => {
  try {
    const list = await getWhiskeysList();
    res.json(list);
  } catch (e) { next(e); }
});

// GET Orders (New endpoint & legacy /appointments alias)
app.get('/orders', async (_req, res, next) => {
  try {
    const list = await getOrdersList();
    res.json(list);
  } catch (e) { next(e); }
});

app.get('/appointments', async (_req, res, next) => {
  try {
    const list = await getOrdersList();
    res.json(list);
  } catch (e) { next(e); }
});

// POST Order (New endpoint & legacy /appointments alias)
async function handleCreateOrder(req, res, next) {
  const whiskey_id = Number(req.body.whiskey_id || req.body.doctor_id);
  const customer_name = String(req.body.customer_name || req.body.patient_name || '').trim();
  const phone = String(req.body.phone || req.body.phone_number || '').trim();
  const reservation_time = req.body.reservation_time || req.body.slot;
  const quantity = Math.max(1, Number(req.body.quantity) || 1);

  if (!whiskey_id || !customer_name || !phone || !reservation_time) {
    return res.status(400).json({
      error: 'missing_fields',
      message: 'กรุณากรอกชื่อผู้สั่ง, เบอร์ติดต่อ, ชนิดเหล้า และวันเวลาที่ต้องการจองให้ครบถ้วน'
    });
  }

  try {
    const pool = await getSqlPool();

    // Check whiskey
    const checkW = await pool.request()
      .input('wid', sql.Int, whiskey_id)
      .query('SELECT name FROM whiskeys WHERE id = @wid');
    
    if (checkW.recordset.length === 0) {
      return res.status(404).json({ error: 'whiskey_not_found', message: 'ไม่พบรายการเหล้าที่เลือก' });
    }

    const whiskey_name = checkW.recordset[0].name;
    const cancel_token = generateToken();

    const insertResult = await pool.request()
      .input('whiskey_id', sql.Int, whiskey_id)
      .input('whiskey_name', sql.NVarChar(100), whiskey_name)
      .input('customer_name', sql.NVarChar(200), customer_name)
      .input('phone', sql.NVarChar(50), phone)
      .input('reservation_time', sql.DateTime2, new Date(reservation_time))
      .input('quantity', sql.Int, quantity)
      .input('cancel_token', sql.NVarChar(64), cancel_token)
      .query(`
        INSERT INTO whiskey_orders (whiskey_id, whiskey_name, customer_name, phone, reservation_time, quantity, cancel_token)
        OUTPUT INSERTED.id, INSERTED.whiskey_id, INSERTED.whiskey_name, INSERTED.customer_name,
               INSERTED.phone, INSERTED.reservation_time, INSERTED.quantity, INSERTED.created
        VALUES (@whiskey_id, @whiskey_name, @customer_name, @phone, @reservation_time, @quantity, @cancel_token)
      `);

    const created = insertResult.recordset[0];
    res.status(201).json({
      ...created,
      cancel_token,              // ← ส่งกลับให้ frontend เก็บใน localStorage
      patient_name: created.customer_name,
      doctor_name: created.whiskey_name,
      slot: created.reservation_time
    });
  } catch (e) { next(e); }
}

app.post('/orders', handleCreateOrder);
app.post('/appointments', handleCreateOrder);

// DELETE Order (Cancel) — requires matching cancel_token
async function handleDeleteOrder(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'invalid_id' });
  }

  // Token comes from JSON body: { cancel_token: "..." }
  const cancel_token = String(req.body?.cancel_token || '').trim();
  if (!cancel_token) {
    return res.status(403).json({
      error: 'token_required',
      message: 'ไม่สามารถลบได้ — กรุณาใช้เบราว์เซอร์เดิมที่ทำการจอง'
    });
  }

  try {
    const pool = await getSqlPool();

    // Fetch existing order to verify token
    const existing = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT cancel_token FROM whiskey_orders WHERE id = @id');

    if (existing.recordset.length === 0) {
      return res.status(404).json({ error: 'not_found', message: 'ไม่พบรายการจองนี้' });
    }

    const stored = existing.recordset[0].cancel_token;
    if (!stored || stored !== cancel_token) {
      return res.status(403).json({
        error: 'token_mismatch',
        message: 'ไม่มีสิทธิ์ยกเลิกรายการนี้ — ต้องใช้เบราว์เซอร์เดิมที่ทำการจอง'
      });
    }

    await pool.request()
      .input('id', sql.Int, id)
      .query('DELETE FROM whiskey_orders WHERE id = @id');

    res.json({ ok: true, message: 'ยกเลิกรายการจองเรียบร้อย' });
  } catch (e) { next(e); }
}

app.delete('/orders/:id', handleDeleteOrder);
app.delete('/appointments/:id', handleDeleteOrder);

// Error handler
app.use((err, _req, res, _next) => {
  if (err.code === 'NO_DB_CONFIG') {
    return res.status(503).json({
      error: 'database_not_configured',
      hint: 'Set AZURE_SQL_CONNECTION_STRING environment variable'
    });
  }
  console.error('unhandled', err);
  res.status(500).json({ error: 'internal_error', message: err.message });
});

app.listen(PORT, () => {
  console.log(`whiskey-reservation-api listening on :${PORT}`);
});