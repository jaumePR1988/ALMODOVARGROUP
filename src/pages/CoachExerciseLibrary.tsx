import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Search, Plus, Dumbbell, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Exercise {
  id: string;
  name: string;
  bodyPart: string;
  imageUrl?: string;
  createdAt?: any;
}

const BODY_PARTS = [
  { id: 'all', label: 'Todos' },
  { id: 'superior', label: 'Superior' },
  { id: 'inferior', label: 'Inferior' },
  { id: 'core', label: 'Core' },
  { id: 'fullbody', label: 'Full Body' }
];

export default function CoachExerciseLibrary() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    const q = query(collection(db, 'exercises'), orderBy('name'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: Exercise[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Exercise);
      });
      setExercises(data);
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching exercises:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredExercises = exercises.filter(ex => {
    const exName = ex.name || '';
    const exBodyPart = ex.bodyPart || '';
    const matchesSearch = exName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'all' || exBodyPart === activeFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="w-full min-h-screen bg-[#121212]">
      <div className="min-h-screen bg-[#121212] flex flex-col font-outfit pb-24 relative overflow-x-hidden max-w-[480px] w-full mx-auto shadow-2xl border-x border-[#222]">
        {/* Header Fijo */}
      <div className="px-6 pt-24 pb-6 bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate('/coach')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Atrás
          </button>
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 mt-2">
          Biblioteca de Ejercicios
        </h1>
        <p className="text-gray-400 text-sm">
          Gestiona los ejercicios disponibles para construir tus WODs.
        </p>

        {/* Buscador y Filtros */}
        <div className="mt-6 flex flex-col gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ejercicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#222] text-white pl-12 pr-4 py-3 rounded-xl border border-[#333] focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] outline-none transition-all placeholder:text-gray-500"
            />
          </div>

          <div className="flex overflow-x-auto gap-2 pb-2 hide-scrollbar">
            {BODY_PARTS.map(part => (
              <button
                key={part.id}
                onClick={() => setActiveFilter(part.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                  activeFilter === part.id
                    ? 'bg-[#E13038] text-white'
                    : 'bg-[#222] text-gray-400 hover:bg-[#333] hover:text-white border border-[#333]'
                }`}
              >
                {part.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista de Ejercicios */}
      <div className="p-6 flex-1">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-t-2 border-[#E13038] rounded-full animate-spin"></div>
          </div>
        ) : filteredExercises.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mx-auto mb-4 border border-[#333]">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <p className="text-gray-400 font-medium text-lg">No hay resultados</p>
            <p className="text-gray-500 text-sm mt-1">
              {searchTerm 
                ? "Prueba buscando con otras palabras" 
                : "Aún no hay ejercicios guardados"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {filteredExercises.map((exercise) => (
              <div 
                key={exercise.id}
                onClick={() => navigate(`/coach/exercises/${exercise.id}/edit`)}
                className="bg-[#1A1A1A] border border-[#333] rounded-2xl overflow-hidden hover:border-[#E13038] cursor-pointer transition-all hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(225,48,56,0.15)] flex flex-col group relative"
              >
                {/* Imagen Cuadrada Superior */}
                <div className="w-full aspect-square bg-[#222] relative overflow-hidden flex items-center justify-center border-b border-[#333]">
                  {exercise.imageUrl ? (
                    <img 
                      src={exercise.imageUrl} 
                      alt={exercise.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <Dumbbell className="w-12 h-12 text-gray-600" />
                  )}
                  
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 mx-1 rounded-md flex items-center border border-white/10">
                    <Star className="w-3 h-3 mr-1 text-[#E13038]" />
                    <span className="text-[10px] text-white font-bold tracking-wider uppercase">
                      {exercise.bodyPart === 'fullbody' ? 'FULL' : (exercise.bodyPart || '').substring(0,3)}
                    </span>
                  </div>
                </div>

                {/* Detalles del Ejercicio Inferior */}
                <div className="p-3 flex items-center justify-center flex-1 min-h-[60px]">
                  <h3 className="text-white font-bold text-sm text-center leading-tight line-clamp-2 group-hover:text-[#E13038] transition-colors">{exercise.name || 'Sin nombre'}</h3>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* FAB Flotante Abajo Derecha para Añadir Nuevo */}
      <div className="fixed bottom-24 w-full max-w-[480px] left-1/2 -translate-x-1/2 pointer-events-none z-20">
        <button 
          onClick={() => navigate('/coach/add-exercise')}
          className="absolute bottom-0 right-6 w-14 h-14 bg-[#E13038] text-white rounded-full flex items-center justify-center shadow-[0_4px_15px_rgba(225,48,56,0.4)] hover:scale-105 active:scale-95 transition-all pointer-events-auto group"
        >
          <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      </div>
    </div>
  );
}
