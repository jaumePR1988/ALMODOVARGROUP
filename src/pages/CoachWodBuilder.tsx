
import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { ArrowLeft, Search, Plus, Trash2, FileText, Download, Dumbbell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateWodPdf, type WodExercise } from '../utils/pdfGenerator';
import UserTopBar from '../components/UserTopBar';

interface ExerciseDoc {
  id: string;
  name: string;
  muscle?: string;
  imageUrl?: string | null;
}

export default function CoachWodBuilder() {
  const navigate = useNavigate();
  const [exercisesDb, setExercisesDb] = useState<ExerciseDoc[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  
  // WOD State
  const [wodExercises, setWodExercises] = useState<WodExercise[]>([]);
  const [sessionName, setSessionName] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().split('T')[0]);

  // Current Input State
  const [selectedExName, setSelectedExName] = useState('');
  const [selectedExImg, setSelectedExImg] = useState<string | null>(null);
  const [series, setSeries] = useState('');
  const [reps, setReps] = useState('');
  const [time, setTime] = useState('');

  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        // Try fetching from 'exercises' collection if it exists
        const q = query(collection(db, 'exercises'), orderBy('name'));
        const shot = await getDocs(q);
        const ex: ExerciseDoc[] = shot.docs.map(d => ({
          id: d.id,
          name: d.data().name,
          muscle: d.data().muscle,
          imageUrl: d.data().imageUrl
        }));
        setExercisesDb(ex);
      } catch (err) {
        console.warn("No se pudo cargar la colección exercises, o no existe todavía.");
      }
    };
    fetchExercises();
  }, []);

  const filteredExercises = exercisesDb.filter(ex => 
    ex.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddExercise = () => {
    if (!selectedExName) return;
    
    setWodExercises(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substring(7),
        name: selectedExName,
        series: series || '-',
        reps: reps || '-',
        time: time || '-',
        imageUrl: selectedExImg || undefined
      }
    ]);

    // Reset current
    setSelectedExName('');
    setSelectedExImg(null);
    setSearchTerm('');
    setSeries('');
    setReps('');
    setTime('');
  };

  const handleRemoveExercise = (id: string) => {
    setWodExercises(prev => prev.filter(ex => ex.id !== id));
  };

  const handleGeneratePDF = async () => {
    if (wodExercises.length === 0) {
      alert("Añade al menos un ejercicio a la sesión.");
      return;
    }
    
    setIsGenerating(true);
    try {
      const activeDate = new Date(sessionDate);
      const blob = await generateWodPdf({
        date: activeDate,
        className: sessionName || 'Entrenamiento General',
        exercises: wodExercises
      });
      
      // Descargar Blob
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `WOD_${sessionDate}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF. Por favor, reintenta.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#121212]">
      <div className="min-h-screen bg-[#121212] flex flex-col font-sans pb-24 relative overflow-x-hidden max-w-[480px] w-full mx-auto shadow-2xl border-x border-[#222]">
      <UserTopBar />

      {/* Header Modal-like */}
      <div className="px-6 pt-24 pb-6 bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={() => navigate('/coach')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </button>
          <div className="flex items-center px-3 py-1 bg-[#E13038]/10 text-[#E13038] rounded-full">
            <FileText className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">Auto-PDF</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 mt-4">
          Creador de WODs
        </h1>
        <p className="text-gray-400 text-sm">
          Añade ejercicios y genera un PDF premium de la sesión al instante.
        </p>
      </div>

      <div className="p-6 space-y-8 flex-1">
        
        {/* Info Sesión */}
        <div className="space-y-4 bg-[#1A1A1A] p-5 rounded-2xl border border-[#333]">
          <h2 className="text-white font-semibold flex items-center">
            Información de la Sesión
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Nombre (Opcional)</label>
              <input 
                type="text" 
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="Ej. Cross Training Lunes"
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:border-[#E13038] focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Fecha</label>
              <input 
                type="date"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:border-[#E13038] focus:outline-none transition-colors [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* Creador */}
        <div className="bg-[#1A1A1A] p-5 rounded-2xl border border-[#333] space-y-4">
          <h2 className="text-white font-semibold">Añadir Ejercicio</h2>
          
          <div className="relative">
            <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar ejercicio o escribir nuevo..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedExName(e.target.value); // Sync manual typing
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full bg-[#222] text-white pl-10 pr-4 py-3 rounded-xl border border-[#333] focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] outline-none transition-all placeholder-gray-500"
            />
            
            {/* Dropdown sugerencias locales */}
            {showDropdown && searchTerm && exercisesDb.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[#222] border border-[#333] rounded-xl max-h-40 overflow-y-auto z-20 shadow-xl">
                {filteredExercises.map(ex => (
                  <button
                    key={ex.id}
                    onMouseDown={() => {
                      setSelectedExName(ex.name);
                      setSelectedExImg(ex.imageUrl || null);
                      setSearchTerm(ex.name);
                      setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-3 hover:bg-[#333] transition-colors border-b border-[#333]/50 last:border-0 flex items-center"
                  >
                    {ex.imageUrl ? (
                      <img src={ex.imageUrl} alt={ex.name} className="w-8 h-8 rounded bg-[#111] object-cover mr-3" />
                    ) : (
                      <div className="w-8 h-8 rounded bg-[#111] flex items-center justify-center mr-3 text-gray-500">
                        <Dumbbell className="w-4 h-4" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{ex.name}</p>
                      {ex.muscle && <p className="text-xs text-gray-400">{ex.muscle}</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Series</label>
              <input 
                type="text" 
                placeholder="4" 
                value={series}
                onChange={(e) => setSeries(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:border-[#E13038] outline-none text-center"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Reps</label>
              <input 
                type="text" 
                placeholder="10-12" 
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:border-[#E13038] outline-none text-center"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 block mb-1">Mins</label>
              <input 
                type="text" 
                placeholder="1:30" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full bg-[#222] border border-[#333] rounded-xl px-3 py-2 text-white text-sm focus:border-[#E13038] outline-none text-center"
              />
            </div>
          </div>

          <button 
            onClick={handleAddExercise}
            disabled={!selectedExName}
            className="w-full mt-2 py-3 rounded-xl font-medium transition-all flex items-center justify-center bg-[#333] text-white hover:bg-[#444] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-5 h-5 mr-2" />
            Añadir a la Sesión
          </button>
        </div>

        {/* Lista de WOD */}
        {wodExercises.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-white font-semibold flex justify-between items-center px-1">
              <span>Ejercicios ({wodExercises.length})</span>
            </h2>
            {wodExercises.map((ex, index) => (
              <div key={ex.id} className="bg-[#1A1A1A] p-3 rounded-xl border border-[#333] flex items-center justify-between group hover:border-[#E13038]/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#222] text-[#E13038] flex items-center justify-center font-bold text-xs shrink-0">
                    {index + 1}
                  </div>
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt={ex.name} className="w-12 h-12 rounded bg-[#111] object-cover shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded bg-[#111] flex items-center justify-center shrink-0 text-gray-500">
                       <Dumbbell className="w-5 h-5"/>
                    </div>
                  )}
                  <div>
                    <h3 className="text-white font-medium text-sm leading-tight">{ex.name.toUpperCase()}</h3>
                    <div className="flex flex-wrap gap-2 text-[11px] text-gray-400 mt-1">
                      {ex.series !== '-' && <span className="px-1.5 py-0.5 bg-[#222] rounded"><span className="text-[#E13038] mr-1">S:</span>{ex.series}</span>}
                      {ex.reps !== '-' && <span className="px-1.5 py-0.5 bg-[#222] rounded"><span className="text-[#E13038] mr-1">R:</span>{ex.reps}</span>}
                      {ex.time !== '-' && <span className="px-1.5 py-0.5 bg-[#222] rounded"><span className="text-[#E13038] mr-1">T:</span>{ex.time}</span>}
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => handleRemoveExercise(ex.id)}
                  className="p-2 text-gray-500 hover:text-[#E13038] transition-colors shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* Floating Action Bar - Generate PDF */}
      <div className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 p-4 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent z-50">
        <button
          onClick={handleGeneratePDF}
          disabled={wodExercises.length === 0 || isGenerating}
          className="w-full bg-gradient-to-r from-[#E13038] to-[#FF4B53] text-white font-bold py-4 px-6 rounded-2xl shadow-lg shadow-[#E13038]/20 flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-100 hover:scale-[1.02] active:scale-[0.98]"
        >
          {isGenerating ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Generando...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Download className="w-6 h-6" />
              <span>GENERAR SESIÓN (PDF)</span>
            </div>
          )}
        </button>
      </div>

      </div>
    </div>
  );
}
