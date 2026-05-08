const { app, BrowserWindow, ipcMain } = require('electron');
const path   = require('path');
const fs     = require('fs');
const crypto = require('crypto');

// ─── Password helpers (crypto built-in, no extra packages) ───────────────────
function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return salt + ':' + hash;
}
function verifyPassword(password, stored) {
  // Support plain text passwords during migration
  if (!stored.includes(':')) return stored === password;
  const [salt, hash] = stored.split(':');
  const hashVerify = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === hashVerify;
}

// ─── DB ───────────────────────────────────────────────────────────────────────
let DB = null;
let dbPath = '';

function autoBackup() {
  if(!DB) return;
  try {
    const userDataPath = app.getPath('userData');
    const backupDir = path.join(userDataPath, 'backups');
    fs.mkdirSync(backupDir, { recursive: true });
    const fecha = new Date().toISOString().slice(0,10);
    const backupPath = path.join(backupDir, 'ws_pos_'+fecha+'.db');
    if(!fs.existsSync(backupPath)) {
      const data = DB.export();
      fs.writeFileSync(backupPath, Buffer.from(data));
      console.log('Backup creado:', backupPath);
      // Keep only last 30 backups
      const files = fs.readdirSync(backupDir)
        .filter(f => f.endsWith('.db'))
        .sort();
      if(files.length > 30) {
        files.slice(0, files.length - 30).forEach(f => {
          fs.unlinkSync(path.join(backupDir, f));
        });
      }
    }
  } catch(e) { console.error('Backup error:', e); }
}

async function initDB() {
  const initSqlJs = require('sql.js');
  const userDataPath = app.getPath('userData');
  dbPath = path.join(userDataPath, 'ws_pos.db');
  fs.mkdirSync(userDataPath, { recursive: true });

  const SQL = await initSqlJs();
  const buffer = fs.existsSync(dbPath) ? fs.readFileSync(dbPath) : null;
  DB = buffer ? new SQL.Database(buffer) : new SQL.Database();
  DB.run('PRAGMA foreign_keys = ON;');
  createTables();
  seedData();
  saveDB();
  setInterval(saveDB, 20000);
  // Auto backup every day at startup
  autoBackup();
  setInterval(autoBackup, 24 * 60 * 60 * 1000);
  console.log('DB ready:', dbPath);
}

function saveDB() {
  if (!DB) return;
  try { fs.writeFileSync(dbPath, Buffer.from(DB.export())); } catch(e) { console.error('saveDB:', e); }
}

function run(sql, p=[]) { DB.run(sql, p); }
function get(sql, p=[]) {
  const s = DB.prepare(sql); s.bind(p);
  const r = s.step() ? s.getAsObject() : null; s.free(); return r;
}
function all(sql, p=[]) {
  const s = DB.prepare(sql); s.bind(p);
  const rows = []; while(s.step()) rows.push(s.getAsObject()); s.free(); return rows;
}

function createTables() {
  DB.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL, usuario TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL, rol TEXT DEFAULT 'cajero',
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS productos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT, nombre TEXT NOT NULL, descripcion TEXT,
      precio REAL DEFAULT 0, costo REAL DEFAULT 0,
      stock INTEGER DEFAULT 0, stock_minimo INTEGER DEFAULT 5,
      categoria TEXT DEFAULT 'General', unidad TEXT DEFAULT 'unidad',
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );
    CREATE TABLE IF NOT EXISTS ventas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL, fecha TEXT NOT NULL,
      cliente_nombre TEXT DEFAULT 'Consumidor Final',
      cliente_nit TEXT DEFAULT 'CF',
      subtotal REAL DEFAULT 0, descuento REAL DEFAULT 0,
      impuesto REAL DEFAULT 0, total REAL DEFAULT 0,
      metodo_pago TEXT DEFAULT 'efectivo',
      monto_recibido REAL DEFAULT 0, cambio REAL DEFAULT 0,
      estado TEXT DEFAULT 'completada',
      usuario_id INTEGER, usuario_nombre TEXT, notas TEXT
    );
    CREATE TABLE IF NOT EXISTS venta_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      venta_id INTEGER NOT NULL, producto_id INTEGER,
      codigo TEXT, nombre TEXT NOT NULL,
      cantidad REAL NOT NULL, precio_unitario REAL NOT NULL,
      descuento REAL DEFAULT 0, subtotal REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cierres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      fecha_inicio TEXT, fecha_fin TEXT,
      total_ventas INTEGER DEFAULT 0,
      total_efectivo REAL DEFAULT 0, total_tarjeta REAL DEFAULT 0,
      total_transferencia REAL DEFAULT 0, gran_total REAL DEFAULT 0,
      usuario_id INTEGER, usuario_nombre TEXT, notas TEXT
    );
    CREATE TABLE IF NOT EXISTS config (clave TEXT PRIMARY KEY, valor TEXT);

    CREATE TABLE IF NOT EXISTS proveedores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nit TEXT,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      contacto TEXT,
      notas TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS compras (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      numero TEXT NOT NULL,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      proveedor_id INTEGER,
      proveedor_nombre TEXT,
      subtotal REAL DEFAULT 0,
      impuesto REAL DEFAULT 0,
      total REAL DEFAULT 0,
      estado TEXT DEFAULT 'pendiente',
      fecha_vencimiento TEXT,
      notas TEXT,
      usuario_id INTEGER,
      usuario_nombre TEXT
    );

    CREATE TABLE IF NOT EXISTS compra_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compra_id INTEGER NOT NULL,
      producto_id INTEGER,
      nombre TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS descuentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      codigo TEXT UNIQUE NOT NULL,
      descripcion TEXT,
      tipo TEXT DEFAULT 'porcentaje',
      valor REAL NOT NULL,
      minimo_compra REAL DEFAULT 0,
      usos_maximos INTEGER DEFAULT 0,
      usos_actuales INTEGER DEFAULT 0,
      fecha_inicio TEXT,
      fecha_fin TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nombre TEXT NOT NULL,
      nit TEXT,
      telefono TEXT,
      email TEXT,
      direccion TEXT,
      notas TEXT,
      activo INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS apertura_caja (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      fondo_inicial REAL DEFAULT 0,
      usuario_id INTEGER,
      usuario_nombre TEXT,
      estado TEXT DEFAULT 'abierta',
      notas TEXT
    );

    CREATE TABLE IF NOT EXISTS kardex (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      producto_id INTEGER NOT NULL,
      tipo TEXT NOT NULL,
      cantidad REAL NOT NULL,
      stock_antes REAL DEFAULT 0,
      stock_despues REAL DEFAULT 0,
      motivo TEXT,
      referencia TEXT,
      usuario_id INTEGER,
      usuario_nombre TEXT
    );

    CREATE TABLE IF NOT EXISTS devoluciones (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      venta_id INTEGER,
      venta_numero TEXT,
      motivo TEXT NOT NULL,
      total_devuelto REAL DEFAULT 0,
      estado TEXT DEFAULT 'completada',
      usuario_id INTEGER,
      usuario_nombre TEXT
    );

    CREATE TABLE IF NOT EXISTS devolucion_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      devolucion_id INTEGER NOT NULL,
      producto_id INTEGER,
      nombre TEXT NOT NULL,
      cantidad REAL NOT NULL,
      precio_unitario REAL NOT NULL,
      subtotal REAL NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fecha TEXT DEFAULT (datetime('now','localtime')),
      usuario_id INTEGER,
      usuario_nombre TEXT,
      accion TEXT NOT NULL,
      tabla TEXT,
      registro_id TEXT,
      detalle TEXT,
      ip TEXT
    );
  `);
}

function seedData() {
  if (!get('SELECT id FROM usuarios WHERE usuario=?', ['admin'])) {
    run('INSERT INTO usuarios (nombre,usuario,password,rol) VALUES (?,?,?,?)', ['Administrador','admin',hashPassword('admin123'),'admin']);
    run('INSERT INTO usuarios (nombre,usuario,password,rol) VALUES (?,?,?,?)', ['Cajero','cajero',hashPassword('cajero123'),'cajero']);
  } else {
    // Migrate existing plain text passwords to hashed on first run
    const users = all('SELECT id, password FROM usuarios');
    users.forEach(u => {
      if (u.password && !u.password.includes(':')) {
        run('UPDATE usuarios SET password=? WHERE id=?', [hashPassword(u.password), u.id]);
        console.log('Migrated password for user id:', u.id);
      }
    });
  }
  const cfgs = [
    ['empresa_nombre','WS POS'],['empresa_nit','1234567-8'],
    ['empresa_direccion',''],['empresa_telefono',''],
    ['empresa_email',''],['ticket_mensaje','Gracias por su compra!'],
    ['iva_porcentaje','5'],['numero_siguiente','1'],
  ];
  cfgs.forEach(([k,v]) => run('INSERT OR IGNORE INTO config (clave,valor) VALUES (?,?)',[k,v]));

  // Inventario en blanco - el cliente agrega sus propios productos
}

// ─── Window ───────────────────────────────────────────────────────────────────
let mainWindow;
let currentUser = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:1280, height:800, minWidth:1024, minHeight:680,
    webPreferences:{
      nodeIntegration:false, contextIsolation:true,
      preload: path.join(__dirname,'preload.js'),
    },
    title:'WS POS', show:false, backgroundColor:'#f4f7fb',
  });
  mainWindow.loadFile(path.join(__dirname,'renderer','index.html'));
  mainWindow.once('ready-to-show',()=>mainWindow.show());
  mainWindow.setMenu(null);
  mainWindow.on('close',()=>saveDB());
}

app.whenReady().then(async()=>{ await initDB(); createWindow(); });
app.on('window-all-closed',()=>{ saveDB(); if(process.platform!=='darwin') app.quit(); });

// ─── Audit Log Helper ─────────────────────────────────────────────────────────
const fmt = n => 'Q'+(+n||0).toFixed(2);

function auditLog(usuarioId, usuarioNombre, accion, tabla, registroId, detalle) {
  if (!DB) return;
  try {
    run(
      'INSERT INTO audit_log (usuario_id,usuario_nombre,accion,tabla,registro_id,detalle) VALUES (?,?,?,?,?,?)',
      [usuarioId||null, usuarioNombre||'Sistema', accion, tabla||null, registroId?String(registroId):null, detalle||null]
    );
  } catch(e) { console.error('auditLog error:', e); }
}

// ─── Wait for DB ──────────────────────────────────────────────────────────────
function waitForDB() {
  return new Promise(resolve=>{
    if(DB){resolve();return;}
    const iv=setInterval(()=>{ if(DB){clearInterval(iv);resolve();} },50);
    setTimeout(()=>{clearInterval(iv);resolve();},15000);
  });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function filterByDate(rows, fi, ff) {
  let start, end;
  if(fi) {
    // Date-only string "YYYY-MM-DD" — parse as local midnight
    if(fi.includes('T')) {
      start = new Date(fi);
    } else {
      const [y,m,d] = fi.split('-').map(Number);
      start = new Date(y, m-1, d, 0, 0, 0, 0);
    }
  } else {
    start = new Date(0);
  }
  if(ff) {
    // Date-only or datetime
    if(ff.includes('T')) {
      end = new Date(ff);
      end.setSeconds(59, 999);
    } else {
      const [y,m,d] = ff.split('-').map(Number);
      end = new Date(y, m-1, d, 23, 59, 59, 999);
    }
  } else {
    end = new Date(9999, 0);
  }
  return rows.filter(v => {
    const vd = new Date(v.fecha);
    return !isNaN(vd) && vd >= start && vd <= end;
  });
}

// ─── IPC ──────────────────────────────────────────────────────────────────────
ipcMain.handle('login', async(_,{usuario,password})=>{
  await waitForDB();
  try {
    const u=get('SELECT * FROM usuarios WHERE usuario=? AND activo=1',[usuario]);
    if(u && verifyPassword(password, u.password)){
      currentUser=u;
      // Log successful login
      auditLog(u.id, u.nombre, 'LOGIN', 'usuarios', u.id, 'Inicio de sesion exitoso');
      return {ok:true,user:{id:u.id,nombre:u.nombre,usuario:u.usuario,rol:u.rol}};
    }
    // Log failed attempt
    auditLog(null, usuario, 'LOGIN_FALLIDO', 'usuarios', null, 'Intento de login fallido');
    return {ok:false,msg:'Usuario o contrasena incorrectos'};
  } catch(e){ return {ok:false,msg:'Error: '+e.message}; }
});

ipcMain.handle('logout',()=>{ currentUser=null; return {ok:true}; });

ipcMain.handle('get-config', async()=>{
  await waitForDB();
  const rows=all('SELECT clave,valor FROM config');
  return Object.fromEntries(rows.map(r=>[r.clave,r.valor]));
});

ipcMain.handle('save-config',async(_,cfg)=>{
  await waitForDB();
  Object.entries(cfg).forEach(([k,v])=>run('INSERT OR REPLACE INTO config(clave,valor)VALUES(?,?)',[k,v]));
  saveDB(); return {ok:true};
});

ipcMain.handle('get-productos',async(_,{buscar='',categoria=''}={})=>{
  await waitForDB();
  let q='SELECT * FROM productos WHERE activo=1'; const p=[];
  if(buscar){q+=' AND (nombre LIKE ? OR codigo LIKE ?)';p.push('%'+buscar+'%','%'+buscar+'%');}
  if(categoria){q+=' AND categoria=?';p.push(categoria);}
  return all(q+' ORDER BY nombre',p);
});

ipcMain.handle('save-producto',async(_,p)=>{
  await waitForDB();
  try {
    if(p.id) run('UPDATE productos SET codigo=?,nombre=?,descripcion=?,precio=?,costo=?,stock=?,stock_minimo=?,categoria=?,unidad=? WHERE id=?',
      [p.codigo,p.nombre,p.descripcion,p.precio,p.costo,p.stock,p.stock_minimo,p.categoria,p.unidad,p.id]);
    else run('INSERT INTO productos(codigo,nombre,descripcion,precio,costo,stock,stock_minimo,categoria,unidad)VALUES(?,?,?,?,?,?,?,?,?)',
      [p.codigo,p.nombre,p.descripcion,p.precio,p.costo,p.stock,p.stock_minimo||5,p.categoria,p.unidad||'unidad']);
    auditLog(currentUser?.id,currentUser?.nombre,p.id?'UPDATE_PRODUCTO':'CREATE_PRODUCTO','productos',p.id,p.nombre);
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('delete-producto',async(_,id)=>{
  await waitForDB();
  run('UPDATE productos SET activo=0 WHERE id=?',[id]); saveDB(); return {ok:true};
});

ipcMain.handle('get-categorias',async()=>{
  await waitForDB();
  return all('SELECT DISTINCT categoria FROM productos WHERE activo=1 ORDER BY categoria').map(r=>r.categoria);
});

ipcMain.handle('nueva-venta',async(_,venta)=>{
  await waitForDB();
  try {
    const cfg=get('SELECT valor FROM config WHERE clave=?',['numero_siguiente']);
    const num=String(cfg?cfg.valor:1).padStart(6,'0');
    const numero='POS-'+num;
    const fecha=new Date().toISOString();
    run('INSERT INTO ventas(numero,fecha,cliente_nombre,cliente_nit,subtotal,descuento,impuesto,total,metodo_pago,monto_recibido,cambio,usuario_id,usuario_nombre,notas)VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
      [numero,fecha,venta.cliente_nombre,venta.cliente_nit,venta.subtotal,venta.descuento,venta.impuesto,venta.total,venta.metodo_pago,venta.monto_recibido,venta.cambio,venta.usuario_id,venta.usuario_nombre,venta.notas||'']);
    const ventaRow=get('SELECT id FROM ventas WHERE numero=?',[numero]);
    const ventaId=ventaRow.id;
    venta.items.forEach(item=>{
      run('INSERT INTO venta_items(venta_id,producto_id,codigo,nombre,cantidad,precio_unitario,descuento,subtotal)VALUES(?,?,?,?,?,?,?,?)',
        [ventaId,item.producto_id||null,item.codigo||'',item.nombre,item.cantidad,item.precio_unitario,item.descuento||0,item.subtotal]);
      if(item.producto_id) {
        const prod = get('SELECT stock FROM productos WHERE id=?',[item.producto_id]);
        const stock_antes = prod ? prod.stock : 0;
        const stock_despues = Math.max(0, stock_antes - item.cantidad);
        run('UPDATE productos SET stock=stock-? WHERE id=?',[item.cantidad,item.producto_id]);
        run('INSERT INTO kardex(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,referencia,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?,?,?,?)',
          [item.producto_id,'venta',item.cantidad,stock_antes,stock_despues,'Venta',numero,venta.usuario_id,venta.usuario_nombre]);
      }
    });
    run('UPDATE config SET valor=? WHERE clave=?',[String(parseInt(num)+1),'numero_siguiente']);
    auditLog(venta.usuario_id,venta.usuario_nombre,'NUEVA_VENTA','ventas',ventaId,'Venta '+numero+' por '+fmt(venta.total));
    saveDB();
    const v=get('SELECT * FROM ventas WHERE id=?',[ventaId]);
    const items=all('SELECT * FROM venta_items WHERE venta_id=?',[ventaId]);
    return {ok:true,venta:{...v,items}};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('get-ventas',async(_,{fecha_ini,fecha_fin,estado}={})=>{
  await waitForDB();
  let q='SELECT * FROM ventas WHERE 1=1'; const p=[];
  if(estado){q+=' AND estado=?';p.push(estado);}
  q+=' ORDER BY id DESC LIMIT 500';
  let rows=all(q,p);
  if(fecha_ini||fecha_fin) rows=filterByDate(rows,fecha_ini,fecha_fin);
  return rows;
});

ipcMain.handle('get-venta-detalle',async(_,id)=>{
  await waitForDB();
  const v=get('SELECT * FROM ventas WHERE id=?',[id]); if(!v) return null;
  return {...v,items:all('SELECT * FROM venta_items WHERE venta_id=?',[id])};
});

ipcMain.handle('revertir-venta',async(_,{id,motivo})=>{
  await waitForDB();
  try {
    const v=get('SELECT * FROM ventas WHERE id=?',[id]);
    if(!v||v.estado==='anulada') return {ok:false,msg:'Venta no valida para anular'};
    const items=all('SELECT * FROM venta_items WHERE venta_id=?',[id]);
    run("UPDATE ventas SET estado='anulada',notas=? WHERE id=?",['ANULADA: '+motivo,id]);
    items.forEach(item=>{ if(item.producto_id) run('UPDATE productos SET stock=stock+? WHERE id=?',[item.cantidad,item.producto_id]); });
    auditLog(currentUser?.id,currentUser?.nombre,'ANULAR_VENTA','ventas',id,'Venta '+v.numero+' anulada. Motivo: '+motivo);
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('hacer-cierre',async(_,{fecha_ini,fecha_fin,notas})=>{
  await waitForDB();
  try {
    const ventas=filterByDate(all("SELECT * FROM ventas WHERE estado='completada'"),fecha_ini,fecha_fin);
    const t={efectivo:0,tarjeta:0,transferencia:0};
    ventas.forEach(v=>{ const m=v.metodo_pago; if(t[m]!==undefined) t[m]+=parseFloat(v.total)||0; else t.efectivo+=parseFloat(v.total)||0; });
    const gran=t.efectivo+t.tarjeta+t.transferencia;
    run('INSERT INTO cierres(fecha_inicio,fecha_fin,total_ventas,total_efectivo,total_tarjeta,total_transferencia,gran_total,usuario_id,usuario_nombre,notas)VALUES(?,?,?,?,?,?,?,?,?,?)',
      [fecha_ini,fecha_fin,ventas.length,t.efectivo,t.tarjeta,t.transferencia,gran,currentUser?.id,currentUser?.nombre,notas||'']);
    auditLog(currentUser?.id,currentUser?.nombre,'CIERRE_CAJA','cierres',null,'Cierre de Q'+gran.toFixed(2)+' con '+ventas.length+' ventas');
    saveDB();
    return {ok:true,resumen:{total_ventas:ventas.length,...t,gran_total:gran}};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('get-cierres',async()=>{
  await waitForDB();
  return all('SELECT * FROM cierres ORDER BY id DESC LIMIT 50');
});

ipcMain.handle('get-usuarios',async()=>{
  await waitForDB();
  return all('SELECT id,nombre,usuario,rol,activo,created_at FROM usuarios ORDER BY nombre');
});

ipcMain.handle('save-usuario',async(_,u)=>{
  await waitForDB();
  try {
    if(u.id){
      if(u.password){
        run('UPDATE usuarios SET nombre=?,usuario=?,password=?,rol=?,activo=? WHERE id=?',
          [u.nombre,u.usuario,hashPassword(u.password),u.rol,u.activo,u.id]);
        auditLog(currentUser?.id,currentUser?.nombre,'UPDATE_USUARIO','usuarios',u.id,'Contrasena actualizada');
      } else {
        run('UPDATE usuarios SET nombre=?,usuario=?,rol=?,activo=? WHERE id=?',
          [u.nombre,u.usuario,u.rol,u.activo,u.id]);
        auditLog(currentUser?.id,currentUser?.nombre,'UPDATE_USUARIO','usuarios',u.id,'Datos actualizados');
      }
    } else {
      run('INSERT INTO usuarios(nombre,usuario,password,rol)VALUES(?,?,?,?)',
        [u.nombre,u.usuario,hashPassword(u.password),u.rol]);
      auditLog(currentUser?.id,currentUser?.nombre,'CREATE_USUARIO','usuarios',null,'Usuario creado: '+u.usuario);
    }
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('get-dashboard',async()=>{
  await waitForDB();
  // Auto-close apertura if it's from a previous day
  const apertura = get("SELECT * FROM apertura_caja WHERE estado='abierta' ORDER BY id DESC LIMIT 1");
  if(apertura) {
    const aperturaDate = new Date(apertura.fecha).toDateString();
    const today = new Date().toDateString();
    if(aperturaDate !== today) {
      run("UPDATE apertura_caja SET estado='auto-cerrada' WHERE estado='abierta'");
      saveDB();
    }
  }
  const start=new Date(); start.setHours(0,0,0,0);
  const end=new Date(); end.setHours(23,59,59,999);
  const allV=all("SELECT * FROM ventas WHERE estado='completada'");
  const hoy=allV.filter(v=>{ const d=new Date(v.fecha); return !isNaN(d)&&d>=start&&d<=end; });
  const ventasHoy={cnt:hoy.length,tot:hoy.reduce((s,v)=>s+(parseFloat(v.total)||0),0)};
  const productosLow=get('SELECT COUNT(*) as cnt FROM productos WHERE stock<=stock_minimo AND activo=1');
  const productosStockBajo=all('SELECT nombre,stock,stock_minimo,categoria FROM productos WHERE stock<=stock_minimo AND activo=1 ORDER BY stock ASC LIMIT 10');
  const ids=hoy.map(v=>v.id);
  let topProductos=[];
  if(ids.length){
    const ph=ids.map(()=>'?').join(',');
    topProductos=all('SELECT vi.nombre,SUM(vi.cantidad) as qty,SUM(vi.subtotal) as total FROM venta_items vi WHERE vi.venta_id IN('+ph+') GROUP BY vi.nombre ORDER BY qty DESC LIMIT 5',ids);
  }
  return {ventasHoy,productosLow,productosStockBajo,topProductos};
});

ipcMain.handle('get-reporte',async(_,{fecha_ini,fecha_fin})=>{
  await waitForDB();
  try {
    const all_v=all('SELECT * FROM ventas');
    const periodo=filterByDate(all_v,fecha_ini,fecha_fin);
    const completadas=periodo.filter(v=>v.estado==='completada');
    const anuladas=periodo.filter(v=>v.estado==='anulada');
    const resumen={totalVentas:completadas.length,totalAnuladas:anuladas.length,
      montoTotal:completadas.reduce((s,v)=>s+(parseFloat(v.total)||0),0),
      montoImpuesto:completadas.reduce((s,v)=>s+(parseFloat(v.impuesto)||0),0),
      montoDescuento:completadas.reduce((s,v)=>s+(parseFloat(v.descuento)||0),0)};
    const porMetodo={};
    completadas.forEach(v=>{ const m=v.metodo_pago||'efectivo'; if(!porMetodo[m]) porMetodo[m]={cantidad:0,total:0}; porMetodo[m].cantidad++;porMetodo[m].total+=parseFloat(v.total)||0; });
    const porDia={};
    completadas.forEach(v=>{ const d=new Date(v.fecha).toLocaleDateString('es-GT'); if(!porDia[d]) porDia[d]={cantidad:0,total:0,anuladas:0}; porDia[d].cantidad++;porDia[d].total+=parseFloat(v.total)||0; });
    anuladas.forEach(v=>{ const d=new Date(v.fecha).toLocaleDateString('es-GT'); if(!porDia[d]) porDia[d]={cantidad:0,total:0,anuladas:0}; porDia[d].anuladas++; });
    const porMes={};
    completadas.forEach(v=>{ const m=new Date(v.fecha).toLocaleDateString('es-GT',{year:'numeric',month:'long'}); if(!porMes[m]) porMes[m]={cantidad:0,total:0}; porMes[m].cantidad++;porMes[m].total+=parseFloat(v.total)||0; });
    const ids=completadas.map(v=>v.id);
    let topProductos=[];
    if(ids.length){ const ph=ids.map(()=>'?').join(','); topProductos=all('SELECT vi.nombre,vi.codigo,SUM(vi.cantidad) as qty,SUM(vi.subtotal) as total FROM venta_items vi WHERE vi.venta_id IN('+ph+') GROUP BY vi.nombre ORDER BY total DESC LIMIT 10',ids); }
    const porCajero={};
    completadas.forEach(v=>{ const c=v.usuario_nombre||'Sin usuario'; if(!porCajero[c]) porCajero[c]={cantidad:0,total:0}; porCajero[c].cantidad++;porCajero[c].total+=parseFloat(v.total)||0; });
    const detalle=periodo.map(v=>({id:v.id,numero:v.numero,fecha:new Date(v.fecha).toLocaleString('es-GT'),cliente:v.cliente_nombre,nit:v.cliente_nit,total:v.total,metodo:v.metodo_pago,estado:v.estado,cajero:v.usuario_nombre}));
    return {ok:true,resumen,porMetodo,porDia,porMes,topProductos,porCajero:Object.entries(porCajero).map(([n,d])=>({nombre:n,...d})),detalle,fecha_ini,fecha_fin};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('get-audit-log', async(_, {limit=100, accion='', usuario_nombre=''}={})=>{
  await waitForDB();
  let q='SELECT * FROM audit_log WHERE 1=1';
  const p=[];
  if(accion){q+=' AND accion=?';p.push(accion);}
  if(usuario_nombre){q+=' AND usuario_nombre LIKE ?';p.push('%'+usuario_nombre+'%');}
  q+=' ORDER BY id DESC LIMIT ?';p.push(limit);
  return all(q,p);
});


// ─── CLIENTES ─────────────────────────────────────────────────────────────────
ipcMain.handle('get-clientes', async(_, buscar='') => {
  await waitForDB();
  if(buscar) return all("SELECT * FROM clientes WHERE activo=1 AND (nombre LIKE ? OR nit LIKE ? OR telefono LIKE ?) ORDER BY nombre",
    ['%'+buscar+'%','%'+buscar+'%','%'+buscar+'%']);
  return all("SELECT * FROM clientes WHERE activo=1 ORDER BY nombre");
});

ipcMain.handle('save-cliente', async(_, c) => {
  await waitForDB();
  try {
    if(c.id) {
      run('UPDATE clientes SET nombre=?,nit=?,telefono=?,email=?,direccion=?,notas=? WHERE id=?',
        [c.nombre,c.nit,c.telefono,c.email,c.direccion,c.notas,c.id]);
    } else {
      run('INSERT INTO clientes(nombre,nit,telefono,email,direccion,notas) VALUES(?,?,?,?,?,?)',
        [c.nombre,c.nit||'CF',c.telefono||'',c.email||'',c.direccion||'',c.notas||'']);
    }
    auditLog(currentUser?.id,currentUser?.nombre,c.id?'UPDATE_CLIENTE':'CREATE_CLIENTE','clientes',c.id,c.nombre);
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('delete-cliente', async(_, id) => {
  await waitForDB();
  run('UPDATE clientes SET activo=0 WHERE id=?',[id]);
  saveDB(); return {ok:true};
});

ipcMain.handle('get-cliente-historial', async(_, clienteNit) => {
  await waitForDB();
  const ventas = all("SELECT * FROM ventas WHERE cliente_nit=? AND estado='completada' ORDER BY fecha DESC LIMIT 50",[clienteNit]);
  const total = ventas.reduce((s,v) => s+(parseFloat(v.total)||0), 0);
  return {ventas, total_compras: ventas.length, monto_total: total};
});

// ─── APERTURA DE CAJA ─────────────────────────────────────────────────────────
ipcMain.handle('get-apertura-activa', async() => {
  await waitForDB();
  return get("SELECT * FROM apertura_caja WHERE estado='abierta' ORDER BY id DESC LIMIT 1");
});

ipcMain.handle('abrir-caja', async(_, {fondo, notas}) => {
  await waitForDB();
  try {
    const activa = get("SELECT id FROM apertura_caja WHERE estado='abierta'");
    if(activa) return {ok:false, msg:'Ya hay una caja abierta'};
    run('INSERT INTO apertura_caja(fondo_inicial,usuario_id,usuario_nombre,notas) VALUES(?,?,?,?)',
      [fondo||0, currentUser?.id, currentUser?.nombre, notas||'']);
    auditLog(currentUser?.id,currentUser?.nombre,'APERTURA_CAJA','apertura_caja',null,'Fondo: Q'+parseFloat(fondo||0).toFixed(2));
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

ipcMain.handle('cerrar-apertura', async(_, {notas}) => {
  await waitForDB();
  try {
    run("UPDATE apertura_caja SET estado='cerrada' WHERE estado='abierta'");
    auditLog(currentUser?.id,currentUser?.nombre,'CIERRE_APERTURA','apertura_caja',null,notas||'');
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});

// ─── KARDEX ───────────────────────────────────────────────────────────────────
ipcMain.handle('get-kardex', async(_, productoId) => {
  await waitForDB();
  return all('SELECT * FROM kardex WHERE producto_id=? ORDER BY id DESC LIMIT 100',[productoId]);
});

ipcMain.handle('ajuste-inventario', async(_, {producto_id, cantidad, tipo, motivo}) => {
  await waitForDB();
  try {
    const prod = get('SELECT * FROM productos WHERE id=?',[producto_id]);
    if(!prod) return {ok:false,msg:'Producto no encontrado'};
    const stock_antes = prod.stock;
    let stock_despues;
    if(tipo==='entrada') stock_despues = stock_antes + Math.abs(cantidad);
    else if(tipo==='salida') stock_despues = Math.max(0, stock_antes - Math.abs(cantidad));
    else if(tipo==='ajuste') stock_despues = cantidad;
    else return {ok:false,msg:'Tipo invalido'};
    run('UPDATE productos SET stock=? WHERE id=?',[stock_despues,producto_id]);
    run('INSERT INTO kardex(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?,?,?)',
      [producto_id,tipo,Math.abs(cantidad),stock_antes,stock_despues,motivo||'Ajuste manual',currentUser?.id,currentUser?.nombre]);
    auditLog(currentUser?.id,currentUser?.nombre,'AJUSTE_INVENTARIO','productos',producto_id,
      prod.nombre+': '+stock_antes+' -> '+stock_despues+' ('+tipo+')');
    saveDB(); return {ok:true, stock_nuevo: stock_despues};
  } catch(e){return {ok:false,msg:e.message};}
});

// ─── DEVOLUCIONES ─────────────────────────────────────────────────────────────
ipcMain.handle('get-devoluciones', async() => {
  await waitForDB();
  return all('SELECT * FROM devoluciones ORDER BY id DESC LIMIT 100');
});

ipcMain.handle('nueva-devolucion', async(_, dev) => {
  await waitForDB();
  try {
    run('INSERT INTO devoluciones(venta_id,venta_numero,motivo,total_devuelto,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?)',
      [dev.venta_id,dev.venta_numero,dev.motivo,dev.total_devuelto,currentUser?.id,currentUser?.nombre]);
    const devRow = get('SELECT id FROM devoluciones ORDER BY id DESC LIMIT 1');
    const devId = devRow.id;
    dev.items.forEach(item => {
      run('INSERT INTO devolucion_items(devolucion_id,producto_id,nombre,cantidad,precio_unitario,subtotal) VALUES(?,?,?,?,?,?)',
        [devId,item.producto_id||null,item.nombre,item.cantidad,item.precio_unitario,item.subtotal]);
      if(item.producto_id) {
        const prod = get('SELECT stock FROM productos WHERE id=?',[item.producto_id]);
        const stock_antes = prod ? prod.stock : 0;
        const stock_despues = stock_antes + item.cantidad;
        run('UPDATE productos SET stock=stock+? WHERE id=?',[item.cantidad,item.producto_id]);
        run('INSERT INTO kardex(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?,?,?)',
          [item.producto_id,'devolucion',item.cantidad,stock_antes,stock_despues,'Devolucion '+dev.venta_numero,currentUser?.id,currentUser?.nombre]);
      }
    });
    auditLog(currentUser?.id,currentUser?.nombre,'DEVOLUCION','devoluciones',devId,
      'Dev de '+dev.venta_numero+' por Q'+dev.total_devuelto);
    saveDB(); return {ok:true, id:devId};
  } catch(e){return {ok:false,msg:e.message};}
});


// ─── PROVEEDORES ──────────────────────────────────────────────────────────────
ipcMain.handle('get-proveedores', async(_, buscar='') => {
  await waitForDB();
  if(buscar) return all("SELECT * FROM proveedores WHERE activo=1 AND (nombre LIKE ? OR nit LIKE ?) ORDER BY nombre",
    ['%'+buscar+'%','%'+buscar+'%']);
  return all("SELECT * FROM proveedores WHERE activo=1 ORDER BY nombre");
});
ipcMain.handle('save-proveedor', async(_, p) => {
  await waitForDB();
  try {
    if(p.id) run('UPDATE proveedores SET nombre=?,nit=?,telefono=?,email=?,direccion=?,contacto=?,notas=? WHERE id=?',
      [p.nombre,p.nit,p.telefono,p.email,p.direccion,p.contacto,p.notas,p.id]);
    else run('INSERT INTO proveedores(nombre,nit,telefono,email,direccion,contacto,notas) VALUES(?,?,?,?,?,?,?)',
      [p.nombre,p.nit||'',p.telefono||'',p.email||'',p.direccion||'',p.contacto||'',p.notas||'']);
    auditLog(currentUser?.id,currentUser?.nombre,p.id?'UPDATE_PROVEEDOR':'CREATE_PROVEEDOR','proveedores',p.id,p.nombre);
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});
ipcMain.handle('delete-proveedor', async(_, id) => {
  await waitForDB();
  run('UPDATE proveedores SET activo=0 WHERE id=?',[id]);
  saveDB(); return {ok:true};
});

// ─── COMPRAS ──────────────────────────────────────────────────────────────────
ipcMain.handle('get-compras', async() => {
  await waitForDB();
  return all('SELECT * FROM compras ORDER BY id DESC LIMIT 100');
});
ipcMain.handle('nueva-compra', async(_, compra) => {
  await waitForDB();
  try {
    const cfg = get('SELECT valor FROM config WHERE clave=?',['numero_siguiente_compra']);
    const num = String(cfg ? cfg.valor : 1).padStart(6,'0');
    const numero = 'OC-'+num;
    run('INSERT INTO compras(numero,proveedor_id,proveedor_nombre,subtotal,impuesto,total,estado,fecha_vencimiento,notas,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?,?,?,?,?,?)',
      [numero,compra.proveedor_id,compra.proveedor_nombre,compra.subtotal,compra.impuesto||0,compra.total,
       compra.estado||'pagada',compra.fecha_vencimiento||null,compra.notas||'',currentUser?.id,currentUser?.nombre]);
    const compraRow = get('SELECT id FROM compras WHERE numero=?',[numero]);
    const compraId = compraRow.id;
    compra.items.forEach(item => {
      run('INSERT INTO compra_items(compra_id,producto_id,nombre,cantidad,precio_unitario,subtotal) VALUES(?,?,?,?,?,?)',
        [compraId,item.producto_id||null,item.nombre,item.cantidad,item.precio_unitario,item.subtotal]);
      if(item.producto_id) {
        const prod = get('SELECT stock FROM productos WHERE id=?',[item.producto_id]);
        const stock_antes = prod ? prod.stock : 0;
        const stock_despues = stock_antes + item.cantidad;
        run('UPDATE productos SET stock=stock+? WHERE id=?',[item.cantidad,item.producto_id]);
        run('UPDATE productos SET costo=? WHERE id=?',[item.precio_unitario,item.producto_id]);
        run('INSERT INTO kardex(producto_id,tipo,cantidad,stock_antes,stock_despues,motivo,referencia,usuario_id,usuario_nombre) VALUES(?,?,?,?,?,?,?,?,?)',
          [item.producto_id,'compra',item.cantidad,stock_antes,stock_despues,'Compra a '+compra.proveedor_nombre,numero,currentUser?.id,currentUser?.nombre]);
      }
    });
    const nextNum = String(parseInt(num)+1);
    if(!cfg) run('INSERT OR REPLACE INTO config(clave,valor) VALUES(?,?)',['numero_siguiente_compra',nextNum]);
    else run('UPDATE config SET valor=? WHERE clave=?',[nextNum,'numero_siguiente_compra']);
    auditLog(currentUser?.id,currentUser?.nombre,'NUEVA_COMPRA','compras',compraId,numero+' - '+compra.proveedor_nombre);
    saveDB();
    return {ok:true, numero};
  } catch(e){return {ok:false,msg:e.message};}
});

// ─── DESCUENTOS ───────────────────────────────────────────────────────────────
ipcMain.handle('get-descuentos', async() => {
  await waitForDB();
  return all('SELECT * FROM descuentos ORDER BY id DESC');
});
ipcMain.handle('save-descuento', async(_, d) => {
  await waitForDB();
  try {
    if(d.id) run('UPDATE descuentos SET codigo=?,descripcion=?,tipo=?,valor=?,minimo_compra=?,usos_maximos=?,fecha_inicio=?,fecha_fin=?,activo=? WHERE id=?',
      [d.codigo.toUpperCase(),d.descripcion,d.tipo,d.valor,d.minimo_compra||0,d.usos_maximos||0,d.fecha_inicio||null,d.fecha_fin||null,d.activo,d.id]);
    else run('INSERT INTO descuentos(codigo,descripcion,tipo,valor,minimo_compra,usos_maximos,fecha_inicio,fecha_fin) VALUES(?,?,?,?,?,?,?,?)',
      [d.codigo.toUpperCase(),d.descripcion||'',d.tipo||'porcentaje',d.valor,d.minimo_compra||0,d.usos_maximos||0,d.fecha_inicio||null,d.fecha_fin||null]);
    saveDB(); return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});
ipcMain.handle('delete-descuento', async(_, id) => {
  await waitForDB();
  run('UPDATE descuentos SET activo=0 WHERE id=?',[id]);
  saveDB(); return {ok:true};
});
ipcMain.handle('validar-descuento', async(_, {codigo, total}) => {
  await waitForDB();
  const d = get('SELECT * FROM descuentos WHERE codigo=? AND activo=1',[codigo.toUpperCase()]);
  if(!d) return {ok:false, msg:'Codigo no encontrado'};
  const now = new Date();
  if(d.fecha_inicio && new Date(d.fecha_inicio) > now) return {ok:false, msg:'Codigo aun no vigente'};
  if(d.fecha_fin && new Date(d.fecha_fin) < now) return {ok:false, msg:'Codigo vencido'};
  if(d.usos_maximos > 0 && d.usos_actuales >= d.usos_maximos) return {ok:false, msg:'Codigo agotado'};
  if(d.minimo_compra > 0 && total < d.minimo_compra) return {ok:false, msg:'Compra minima: Q'+d.minimo_compra.toFixed(2)};
  let monto = 0;
  if(d.tipo === 'porcentaje') monto = (total * d.valor) / 100;
  else monto = d.valor;
  monto = Math.min(monto, total);
  return {ok:true, descuento:d, monto_descuento:monto};
});
ipcMain.handle('usar-descuento', async(_, codigo) => {
  await waitForDB();
  run('UPDATE descuentos SET usos_actuales=usos_actuales+1 WHERE codigo=?',[codigo.toUpperCase()]);
  saveDB(); return {ok:true};
});

// ─── BACKUP MANUAL ────────────────────────────────────────────────────────────
ipcMain.handle('hacer-backup', async() => {
  await waitForDB();
  try {
    const { dialog } = require('electron');
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Guardar backup de base de datos',
      defaultPath: 'ws_pos_backup_'+new Date().toISOString().slice(0,10)+'.db',
      filters: [{ name: 'Base de datos', extensions: ['db'] }]
    });
    if(result.canceled) return {ok:false, msg:'Cancelado'};
    const data = DB.export();
    fs.writeFileSync(result.filePath, Buffer.from(data));
    auditLog(currentUser?.id,currentUser?.nombre,'BACKUP_MANUAL','config',null,'Backup guardado en: '+result.filePath);
    return {ok:true, path:result.filePath};
  } catch(e){return {ok:false,msg:e.message};}
});
ipcMain.handle('restaurar-backup', async() => {
  await waitForDB();
  try {
    const { dialog } = require('electron');
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Restaurar backup',
      filters: [{ name: 'Base de datos', extensions: ['db'] }],
      properties: ['openFile']
    });
    if(result.canceled || !result.filePaths.length) return {ok:false, msg:'Cancelado'};
    const buffer = fs.readFileSync(result.filePaths[0]);
    const initSqlJs = require('sql.js');
    const SQL = await initSqlJs();
    DB = new SQL.Database(buffer);
    saveDB();
    return {ok:true};
  } catch(e){return {ok:false,msg:e.message};}
});
ipcMain.handle('get-backups-list', async() => {
  try {
    const backupDir = path.join(app.getPath('userData'), 'backups');
    if(!fs.existsSync(backupDir)) return [];
    return fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.db'))
      .sort().reverse()
      .map(f => ({
        nombre: f,
        fecha: f.replace('ws_pos_','').replace('.db',''),
        path: path.join(backupDir, f),
        size: Math.round(fs.statSync(path.join(backupDir,f)).size/1024)+'KB'
      }));
  } catch(e){ return []; }
});

ipcMain.handle('print-ticket',async(_,htmlContent)=>{
  const {BrowserWindow} = require('electron');

  // Ventana invisible del tamano exacto del ticket 80mm
  const win = new BrowserWindow({
    width: 302,       // 80mm en pixeles aprox
    height: 800,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));

  // Esperar a que cargue completamente
  await new Promise(resolve => setTimeout(resolve, 800));

  return new Promise(resolve => {
    win.webContents.print(
      {
        silent: false,              // Muestra dialogo de impresoras
        printBackground: true,
        color: false,               // Blanco y negro para termica
        margins: {
          marginType: 'none',       // Sin margenes extra
        },
        pageSize: {
          width: 80000,             // 80mm en micrones (80 * 1000)
          height: 297000,           // Alto variable - maximo A4
        },
      },
      (success, err) => {
        win.close();
        resolve({ ok: success, err: err });
      }
    );
  });
});
