'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const router = useRouter();

  const handleCreate = () => {
    if (name.trim()) {
      router.push(`/crear?name=${encodeURIComponent(name.trim())}`);
    } else {
      alert('Por favor, ingresa un nombre.');
    }
  };

  const handleJoin = () => {
    if (name.trim() && code.trim()) {
      router.push(`/sala/${code.trim().toUpperCase()}?name=${encodeURIComponent(name.trim())}`);
    } else {
      alert('Por favor, ingresa un nombre y un código de sala.');
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 p-6 bg-gray-800 rounded-lg shadow-xl">
      <div className="w-full max-w-sm">
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Tu Nombre
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Walter"
          className="w-full p-3 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>

      <div className="w-full max-w-sm flex flex-col gap-4">
        <button
          onClick={handleCreate}
          disabled={!name.trim()}
          className="w-full p-3 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Crear Sala
        </button>
      </div>

      <div className="w-full max-w-sm border-t border-gray-700 pt-6">
        <label htmlFor="code" className="block text-sm font-medium text-gray-300 mb-2">
          Código de Sala
        </label>
        <input
          id="code"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Ej: ABC123"
          className="w-full p-3 mb-4 rounded-md bg-gray-700 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
        <button
          onClick={handleJoin}
          disabled={!name.trim() || !code.trim()}
          className="w-full p-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
        >
          Unirse a Sala
        </button>
      </div>
    </div>
  );
}
