'use client';

import { useEffect, useState, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { db, auth, getAnonymousUser } from '@/lib/firebase';
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, setDoc, serverTimestamp } from 'firebase/firestore';
import { User, Crown, Ghost, Skull, CheckCircle } from 'lucide-react';
import Image from 'next/image';

function shuffleArray(array) {
  let currentIndex = array.length,  randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }
  return array;
}

function GameRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [roomData, setRoomData] = useState(null);
  const [localName, setLocalName] = useState('');
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [impostorCount, setImpostorCount] = useState(1);

  const codigo = params.codigo.toUpperCase();

  useEffect(() => {
    const name = searchParams.get('name');
    if (!name) {
      router.push('/');
      return;
    }
    setLocalName(name);

    getAnonymousUser()
      .then((user) => {
        setUserId(user.uid);
        const roomRef = doc(db, 'salas', codigo);
        
        // Añadir jugador a la sala
        updateDoc(roomRef, {
          jugadores: arrayUnion(name)
        }).catch(() => {
          setError('No se pudo encontrar la sala. ¿Escribiste bien el código?');
        });
      })
      .catch(() => setError('Error de autenticación.'));

  }, [codigo, searchParams, router]);

  useEffect(() => {
    if (!codigo) return;
    const roomRef = doc(db, 'salas', codigo);
    
    const unsubscribe = onSnapshot(roomRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setRoomData(data);
        setImpostorCount(data.impostorCount || 1);
        setError('');
      } else {
        setError('Sala no encontrada.');
        setRoomData(null);
      }
    }, (err) => {
      console.error(err);
      setError('Error al escuchar la sala.');
    });

    return () => unsubscribe();
  }, [codigo]);

  if (error) return <p className="text-center text-red-400 text-xl">{error}</p>;
  if (!roomData) return <p className="text-center text-cyan-400 text-xl">Cargando sala...</p>;

  const isHost = roomData.host === localName;
  const myAssignment = roomData.currentRound?.assigned?.[localName];
  const impostors = roomData.currentRound?.impostors || [];

  const handleStartGame = async () => {
    if (!isHost) return;
    const count = parseInt(impostorCount, 10);
    
    // Contamos jugadores vs impostores
    if (roomData.jugadores.length <= count) {
       alert("No puedes tener tantos o más impostores que jugadores.");
       return;
    }
    
    // Contamos imágenes vs (jugadores - impostores)
    // ESTE ES EL CAMBIO: solo necesitamos fotos para los NO-IMPOSTORES
    const nonImpostors = roomData.jugadores.length - count;
    if (roomData.imagenes.length < nonImpostors) {
      alert(`No hay suficientes imágenes. Necesitas al menos ${nonImpostors} imágenes para los jugadores.`);
      return;
    }

    setLoading(true);
    const shuffledPlayers = shuffleArray([...roomData.jugadores]);
    const shuffledImages = shuffleArray([...roomData.imagenes]);
    

    const newImpostors = [];
    const assignedData = {};
    let imageIndex = 0; // Índice para repartir imágenes solo a no-impostores

    shuffledPlayers.forEach((player, index) => {
      const isImpostor = index < count; // Los primeros 'count' jugadores son impostores
      
      if (isImpostor) {
        assignedData[player] = {
          imageUrl: null, // El impostor no recibe foto
          isImpostor: true,
        };
        newImpostors.push({ name: player }); // No guardamos foto del impostor
      } else {
        assignedData[player] = {
          imageUrl: shuffledImages[imageIndex], // Asignamos una foto
          isImpostor: false,
        };
        imageIndex++; // Pasamos a la siguiente foto
      }
    });

    const roomRef = doc(db, 'salas', codigo);
    await updateDoc(roomRef, {
      estado: 'jugando',
      impostorCount: count,
      currentRound: {
        assigned: assignedData,
        impostors: newImpostors,
        startedAt: serverTimestamp(),
      }
    });
    setLoading(false);
  };

  const handleReveal = async () => {
    if (!isHost) return;
    setLoading(true);
    const roomRef = doc(db, 'salas', codigo);
    await updateDoc(roomRef, { estado: 'revelado' });
    setLoading(false);
  };

  const handleNextRound = async () => {
    // Esencialmente, es lo mismo que iniciar el juego
    await handleStartGame();
  };
  
  const handleImpostorCountChange = async (e) => {
    const count = parseInt(e.target.value, 10);
    setImpostorCount(count);
    if(isHost) {
      const roomRef = doc(db, 'salas', codigo);
      await updateDoc(roomRef, { impostorCount: count });
    }
  }

  // --- Vistas de Juego ---

  // 1. Sala de Espera
  if (roomData.estado === 'espera') {
    return (
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Sala de Espera</h2>
          <p className="mb-4">Código de sala: <strong className="text-xl text-white font-mono bg-gray-700 px-2 py-1 rounded">{codigo}</strong></p>
          <h3 className="text-lg font-semibold mb-2">Jugadores ({roomData.jugadores.length} / 12):</h3>
          <ul className="space-y-2 max-h-60 overflow-y-auto">
            {roomData.jugadores.map((name) => (
              <li key={name} className="flex items-center gap-2 p-2 bg-gray-700 rounded-md">
                {name === roomData.host ? (
                  <Crown className="h-5 w-5 text-yellow-400" />
                ) : (
                  <User className="h-5 w-5 text-gray-400" />
                )}
                <span className={name === localName ? 'font-bold text-white' : 'text-gray-300'}>
                  {name} {name === localName && '(Tú)'}
                </span>
              </li>
            ))}
          </ul>
        </div>
        {isHost && (
          <div className="w-full md:w-1/3 bg-gray-800 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Controles del Host</h3>
            <div className="mb-4">
              <label htmlFor="impostorCount" className="block text-sm font-medium text-gray-300 mb-2">Impostores:</label>
              <select
                id="impostorCount"
                value={impostorCount}
                onChange={handleImpostorCountChange}
                className="w-full p-2 rounded-md bg-gray-700 text-white border border-gray-600"
              >
                <option value={1}>1 Impostor</option>
                <option value={2}>2 Impostores</option>
              </select>
            </div>
            <button
              onClick={handleStartGame}
              disabled={loading || roomData.jugadores.length < 2}
              className="w-full p-3 rounded-md bg-green-600 text-white font-semibold hover:bg-green-500 disabled:bg-gray-600"
            >
              {loading ? 'Iniciando...' : 'Iniciar Juego'}
            </button>
            {roomData.jugadores.length < 2 && <p className="text-xs text-yellow-400 mt-2">Se necesitan al menos 2 jugadores.</p>}
            <p className="text-xs text-gray-400 mt-4">Enlaces de imágenes: {roomData.imagenes.length}</p>
          </div>
        )}
      </div>
    );
  }

  // 2. Juego en Curso
  if (roomData.estado === 'jugando') {
    if (!myAssignment) return <p className="text-center text-xl">Asignando roles...</p>;
    
    return (
      <div className="text-center">
        {myAssignment.isImpostor ? (
          <h2 className="text-6xl font-extrabold text-red-500 animate-pulse mb-6">
            ¡ERES IMPOSTOR!
          </h2>
        ) : (
          <>
            {/* TU FRASE PERSONALIZADA */}
            <h2 className="text-6xl font-extrabold text-green-500 mb-6">
              ¡te salvaste ctm!
            </h2>
            
            {/* La imagen del futbolista */}
            <div className="relative w-full max-w-lg mx-auto aspect-square rounded-lg overflow-hidden shadow-2xl border-4 border-gray-700">
              <Image
                src={myAssignment.imageUrl}
                alt="Imagen asignada"
                layout="fill"
                objectFit="cover"
                priority
              />
            </div>
          </>
        )}
        
        {isHost && (
          <button
            onClick={handleReveal}
            disabled={loading}
            className="mt-8 px-8 py-3 rounded-md bg-yellow-500 text-black font-semibold hover:bg-yellow-400 disabled:bg-gray-600"
          >
            {loading ? 'Revelando...' : 'Revelar Impostor(es)'}
          </button>
        )}
      </div>
    );
  }
  
  // 3. Fase de Revelación
  if (roomData.estado === 'revelado') {
    if (!impostors || impostors.length === 0) return <p>Cargando revelación...</p>

    return (
      <div className="text-center">
        <h2 className="text-5xl font-extrabold text-red-500 mb-8">El Impostor era...</h2>
        <div className="flex flex-wrap justify-center gap-6">
          {impostors.map(impostor => (
            <div key={impostor.name} className="flex flex-col items-center p-4 bg-gray-800 rounded-lg shadow-lg">
              <Skull className="h-16 w-16 text-red-500 mb-4" />
              <p className="mt-4 text-2xl font-bold text-white">{impostor.name}</p>
            </div>
          ))}
        </div>
        
        {isHost && (
          <button
            onClick={handleNextRound}
            disabled={loading}
            className="mt-10 px-8 py-3 rounded-md bg-cyan-600 text-white font-semibold hover:bg-cyan-500 disabled:bg-gray-600"
          >
            {loading ? 'Cargando...' : 'Siguiente Ronda'}
          </button>
        )}
      </div>
    );
  }

  return <p>Estado de sala desconocido.</p>;
}

export default function GameRoomPage() {
  return (
    <Suspense fallback={<div className="text-center text-xl">Cargando...</div>}>
      <GameRoomContent />
    </Suspense>
  )
}
