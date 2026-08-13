import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from 'sonner';

export interface PosProducto {
  id: number;
  codigo: string | null;
  nombre: string;
  precio: number;
  stock: number;
  imagenUrl?: string | null;
}

export interface PosCotizacion {
  id: number;
  numero: string;
  clienteNombre: string;
  clienteNit: string | null;
  total: number;
  items: any[];
}

export interface CartItem {
  tipo: 'inventario' | 'libre';
  productoId: number | null;
  codigo: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  stock: number;
  descuento: number;
  subtotal: number;
}

export interface PosConfig {
  empresa_nombre: string;
  iva_porcentaje: string;
  moneda_simbolo: string;
  ticket_mensaje: string;
  empresa_nit: string;
  empresa_direccion: string;
  empresa_telefono: string;
  ticket_mostrar_logo?: string;
  fel_activo?: string;
  email_factura_activo?: string;
}

export function usePos() {
  const [productos, setProductos] = useState<PosProducto[]>([]);
  const [cotizaciones, setCotizaciones] = useState<PosCotizacion[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [buscar, setBuscar] = useState('');
  const [buscarCot, setBuscarCot] = useState('');
  const [config, setConfig] = useState<PosConfig | null>(null);
  
  // Cliente state
  const [clienteNombre, setClienteNombre] = useState('Consumidor Final');
  const [clienteNit, setClienteNit] = useState('CF');
  const [clienteCorreo, setClienteCorreo] = useState('');
  const [clienteId, setClienteId] = useState<number | null>(null);
  const [clienteTieneCorreo, setClienteTieneCorreo] = useState(false);
  const [nitStatus, setNitStatus] = useState<'idle' | 'found' | 'notfound'>('idle');
  
  // Checkout state
  const [metodoPago, setMetodoPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [descPct, setDescPct] = useState(0);
  const [codigoDesc, setCodigoDesc] = useState('');
  
  // General UI state
  const [loading, setLoading] = useState(false);
  const [showCobro, setShowCobro] = useState(false);
  const [showRegCliente, setShowRegCliente] = useState(false);
  const [lastVenta, setLastVenta] = useState<any>(null);
  const [lastFel, setLastFel] = useState<any>(null);
  const [tab, setTab] = useState<'inventario' | 'cotizacion' | 'libre'>('inventario');
  const [cotizacionId, setCotizacionId] = useState<number | null>(null);

  // Forms
  const [regForm, setRegForm] = useState({ nombre: '', nit: '', telefono: '', direccion: '', correo: '' });
  const [libreForm, setLibreForm] = useState({ codigo: '', nombre: '', precio: '', cantidad: '1' });
  
  const searchRef = useRef<HTMLInputElement>(null);

  const fetchProductos = useCallback(async (query: string) => {
    try {
      const res = await fetch(`/api/productos?buscar=${encodeURIComponent(query)}&limit=60`);
      if (res.ok) {
        setProductos(await res.json());
      }
    } catch {
      // Ignore abort/network errors on typing
    }
  }, []);

  // Debounce product search by 200ms
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProductos(buscar);
    }, 200);
    return () => clearTimeout(timer);
  }, [buscar, fetchProductos]);

  const loadProductos = useCallback(async () => {
    fetchProductos(buscar);
  }, [buscar, fetchProductos]);

  const loadCotizaciones = useCallback(async () => {
    const res = await fetch(`/api/cotizaciones?estado=aceptada,pendiente`);
    const data = await res.json();
    setCotizaciones(Array.isArray(data) ? data : []);
  }, []);

  const loadConfig = useCallback(async () => {
    const res = await fetch('/api/config');
    const data = await res.json();
    setConfig(data);
  }, []);

  const addInventario = (prod: PosProducto) => {
    if (prod.stock <= 0) { toast.error('Sin stock'); return; }
    setCart(prev => {
      const ex = prev.find(x => x.productoId === prod.id);
      if (ex) {
        if (ex.cantidad >= ex.stock) { toast.warning('Stock máximo'); return prev; }
        return prev.map(x => x.productoId === prod.id ? { ...x, cantidad: x.cantidad + 1, subtotal: (x.cantidad + 1) * x.precioUnitario } : x);
      }
      return [...prev, { tipo: 'inventario', productoId: prod.id, codigo: prod.codigo || '', nombre: prod.nombre, cantidad: 1, precioUnitario: prod.precio, stock: prod.stock, descuento: 0, subtotal: prod.precio }];
    });
  };

  const addLibre = () => {
    if (!libreForm.nombre || !libreForm.precio) { toast.error('Descripción y precio requeridos'); return; }
    const precio = parseFloat(libreForm.precio) || 0;
    const cantidad = parseInt(libreForm.cantidad) || 1;
    setCart(prev => [...prev, { tipo: 'libre', productoId: null, codigo: libreForm.codigo, nombre: libreForm.nombre, cantidad, precioUnitario: precio, stock: 99999, descuento: 0, subtotal: precio * cantidad }]);
    setLibreForm({ codigo: '', nombre: '', precio: '', cantidad: '1' });
    toast.success('Item agregado');
  };

  const removeItem = (i: number) => setCart(prev => prev.filter((_, idx) => idx !== i));
  
  const changeQty = (i: number, d: number) => setCart(prev => prev.map((item, idx) => {
    if (idx !== i) return item;
    const q = Math.max(1, item.tipo === 'libre' ? item.cantidad + d : Math.min(item.stock, item.cantidad + d));
    return { ...item, cantidad: q, subtotal: q * item.precioUnitario - item.descuento };
  }));
  
  const changePrice = (i: number, val: string) => setCart(prev => prev.map((item, idx) => {
    if (idx !== i) return item;
    const p = parseFloat(val) || 0;
    return { ...item, precioUnitario: p, subtotal: item.cantidad * p - item.descuento };
  }));

  const clearCart = () => {
    setCart([]);
    setDescPct(0);
    setCodigoDesc('');
  };

  const resetPos = () => {
    setCart([]); setClienteNombre('Consumidor Final'); setClienteNit('CF'); setClienteCorreo(''); setClienteId(null); setClienteTieneCorreo(false);
    setMetodoPago('efectivo'); setMontoRecibido(''); setDescPct(0); setCodigoDesc('');
    setShowCobro(false); setLastVenta(null); setLastFel(null); setNitStatus('idle'); setCotizacionId(null);
    searchRef.current?.focus();
  };


  return {
    state: {
      productos, cotizaciones, cart, buscar, buscarCot, config,
      clienteNombre, clienteNit, clienteCorreo, clienteId, clienteTieneCorreo, nitStatus,
      metodoPago, montoRecibido, descPct, codigoDesc,
      loading, showCobro, showRegCliente, lastVenta, lastFel, tab, cotizacionId,
      regForm, libreForm, searchRef
    },
    setters: {
      setBuscar, setBuscarCot,
      setClienteNombre, setClienteNit, setClienteCorreo, setClienteId, setClienteTieneCorreo, setNitStatus,
      setMetodoPago, setMontoRecibido, setDescPct, setCodigoDesc,
      setLoading, setShowCobro, setShowRegCliente, setLastVenta, setLastFel, setTab, setCotizacionId,
      setRegForm, setLibreForm, setCart
    },
    actions: {
      loadProductos, loadCotizaciones, loadConfig,
      addInventario, addLibre, removeItem, changeQty, changePrice, resetPos, clearCart
    }
  };
}
