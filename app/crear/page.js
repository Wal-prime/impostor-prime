'use client';

import { useState, Suspense }from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { db, getAnonymousUser } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [links, setLinks] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = async () => {
    const name = searchParams.get('name');
    if (!name) {
      setError('Nombre de host no encontrado. Vuelve al inicio.');
      return;
    }

    // 1. Tomar el texto de los enlaces
    // 2. Separarlo por cada salto de línea (cada vez que diste "Enter")
    // 3. Filtrar líneas vacías
    const imageUrls = links.split('\n').filter(link => link.trim().startsWith('http'));

    if (imageUrls.length === 0) {
      setError('Debes pegar al menos un enlace de imagen (http...://).');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await getAnonymousUser();
      const roomCode = nanoid(6).toUpperCase();

      const roomData = {
        host: name,
        hostId: user.uid,
        jugadores: [name],
        imagenes: imageUrls, // <-- Aquí guardamos la lista de enlaces
        estado: 'espera',
        impostorCount: 1,
        createdAt: serverTimestamp(),
        currentRound: null,
      };

      await setDoc(doc(db, 'salas', roomCode), roomData);

      router.push(`/sala/${roomCode}?name=${encodeURIComponent(name)}`);
    } catch (err) {
      console.error(err);
      setError('Error al crear la sala. Revisa la consola.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gray-800 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-6 text-cyan-400">Crear Nueva Sala</h2>
      
      <div className="mb-4">
        <label htmlFor="image-links" className="block text-sm font-medium text-gray-300 mb-2">
          Pega los enlaces de las imágenes (una por línea)
        </label>
        <textarea
          id="image-links"
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://.../messi.jpg
https://.../ronaldo.png
https://.../neymar.webp"
          rows={10}
          className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <p className="text-xs text-gray-500 mt-1">
          Pega el enlace de cada foto de futbolista. Asegúrate de que cada enlace comience con "http".
        </p>
      </div>

      {error && <p className="text-red-400 mt-4">{error}</p>}

      <button
        onClick={handleCreateRoom}
        disabled={loading || links.trim().length === 0}
        className="w-full p-3 mt-6 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-500 disabled:bg-gray-600 transition-colors"
      >
        {loading ? 'Creando Sala...' : `Crear Sala`}
      </button>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <CreateRoomContent />
    </Suspense>
  )
}
