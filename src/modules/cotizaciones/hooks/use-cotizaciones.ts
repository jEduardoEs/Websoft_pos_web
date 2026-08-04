import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { Cotizacion } from '../types/cotizacion';

export function useCotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Pin and Editing status
  const [pinModal, setPinModal] = useState<{ id: number; estado: string; numero: string } | null>(null);
  const [pin, setPin] = useState('');
  const [pinLoading, setPinLoading] = useState(false);
  const [pinError, setPinError] = useState('');
  
  // Modals and selections
  const [showFormModal, setShowFormModal] = useState(false);
  const [selected, setSelected] = useState<Cotizacion | null>(null);

  // Email state
  const [sendModal, setSendModal] = useState<Cotizacion | null>(null);
  const [sendEmail, setSendEmail] = useState('');
  const [sendLoading, setSendLoading] = useState(false);

  const loadCotizaciones = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cotizaciones');
      const data = await res.json();
      setCotizaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      toast.error('Error al cargar cotizaciones');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCotizaciones();
  }, [loadCotizaciones]);

  const confirmPin = async () => {
    if (!pinModal) return;
    setPinError('');
    setPinLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${pinModal.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: pinModal.estado, pinAdmin: pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || 'PIN incorrecto');
      } else {
        toast.success(`Cotización ${pinModal.estado}`);
        setPinModal(null);
        setPin('');
        loadCotizaciones();
      }
    } catch (err) {
      setPinError('Error de conexión');
    } finally {
      setPinLoading(false);
    }
  };

  const enviarPorCorreo = async () => {
    if (!sendModal || !sendEmail.includes('@')) return;
    setSendLoading(true);
    try {
      const res = await fetch(`/api/cotizaciones/${sendModal.id}/enviar-correo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: sendEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Cotización enviada por correo');
        setSendModal(null);
        setSendEmail('');
      } else {
        toast.error(data.error || 'Error al enviar');
      }
    } catch (e) {
      toast.error('Error de conexión al servidor de correo');
    } finally {
      setSendLoading(false);
    }
  };

  return {
    state: {
      cotizaciones, loading,
      pinModal, pin, pinLoading, pinError,
      showFormModal, selected,
      sendModal, sendEmail, sendLoading
    },
    setters: {
      setPinModal, setPin, setPinError,
      setShowFormModal, setSelected,
      setSendModal, setSendEmail
    },
    actions: {
      loadCotizaciones, confirmPin, enviarPorCorreo
    }
  };
}
