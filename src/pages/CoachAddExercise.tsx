import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, doc, getDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { ArrowLeft, Save, Upload, Dumbbell, Image as ImageIcon, Trash2 } from 'lucide-react';
import UserTopBar from '../components/UserTopBar';

export default function CoachAddExercise() {
  const navigate = useNavigate();
  const { id } = useParams();
  
  const [name, setName] = useState('');
  const [bodyPart, setBodyPart] = useState('Full Body');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (id) {
      setIsFetching(true);
      const fetchExercise = async () => {
        try {
          const docRef = doc(db, 'exercises', id);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setName(data.name || '');
            setBodyPart(data.muscle || 'Full Body');
            if (data.imageUrl) {
              setImagePreview(data.imageUrl);
              setOriginalImageUrl(data.imageUrl);
            }
          }
        } catch (error) {
          console.error("Error fetching exercise:", error);
        } finally {
          setIsFetching(false);
        }
      };
      fetchExercise();
    }
  }, [id]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      alert("Introduce un nombre para el ejercicio.");
      return;
    }
    
    setIsSaving(true);
    
    try {
      let imageUrl = '';
      
      // 1. Upload image to Storage if exists
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `exercises/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      } else if (originalImageUrl && !imageFile) {
        imageUrl = originalImageUrl;
      }

      // 2. Save or Update document to Firestore
      if (id) {
        await updateDoc(doc(db, 'exercises', id), {
          name: name.trim(),
          muscle: bodyPart,
          imageUrl: imageUrl || null,
        });
      } else {
        await addDoc(collection(db, 'exercises'), {
          name: name.trim(),
          muscle: bodyPart,
          imageUrl: imageUrl || null,
          createdAt: serverTimestamp(),
        });
      }
      
      setShowToast(true);
      if (!id) {
        // Only clear if creating new
        setName('');
        setImageFile(null);
        setImagePreview(null);
      }
      
      // Ocultar toast después de 3s
      setTimeout(() => setShowToast(false), 3000);
      
    } catch (err) {
      console.error("Error guardando el ejercicio: ", err);
      alert("Hubo un error al guardar. Revisa la consola.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'exercises', id));
      navigate('/coach/exercises'); // Redirigir a la galería tras borrar
    } catch (err) {
      console.error("Error borrando el ejercicio: ", err);
      alert("Hubo un error al borrar el ejercicio.");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (isFetching) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="w-8 h-8 border-t-2 border-[#E13038] rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#121212]">
      <div className="min-h-screen bg-[#121212] flex flex-col font-sans pb-24 relative overflow-x-hidden max-w-[480px] w-full mx-auto shadow-2xl border-x border-[#222]">
        <UserTopBar />

      {/* Premium Toast Notification */}
      <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="bg-[#4CAF50] text-white px-5 py-3 rounded-full shadow-[0_0_15px_rgba(76,175,80,0.5)] font-medium text-sm flex items-center">
          <svg className="w-5 h-5 mr-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ¡Ejercicio guardado con éxito!
        </div>
      </div>

      <div className="px-6 pt-24 pb-6 bg-[#1A1A1A] border-b border-[#333] sticky top-0 z-10">
        <div className="flex items-center mb-4">
          <button 
            onClick={() => navigate('/coach')}
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Atrás
          </button>
        </div>
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2 mt-2">
          {id ? 'Editar Ejercicio' : 'Añadir Ejercicio'}
        </h1>
        <p className="text-gray-400 text-sm">
          {id ? 'Modifica los detalles del ejercicio actual.' : 'Registra nuevos ejercicios en la biblioteca para usarlos en el Creador de WODs.'}
        </p>
      </div>

      <div className="p-6 flex-1 space-y-6">
        
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Nombre del Ejercicio *</label>
          <div className="relative">
            <Dumbbell className="absolute left-3 top-3.5 w-5 h-5 text-gray-500" />
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Burpees, Power Snatch..."
              className="w-full bg-[#222] border border-[#333] rounded-xl pl-11 pr-4 py-3 text-white focus:border-[#E13038] focus:ring-1 focus:ring-[#E13038] outline-none transition-all placeholder-gray-500"
            />
          </div>
        </div>

        {/* Body Part Selector */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Parte a trabajar</label>
          <div className="grid grid-cols-2 gap-3">
            {['Full Body', 'Tren Superior', 'Tren Inferior', 'Core'].map(part => (
              <button
                key={part}
                onClick={() => setBodyPart(part)}
                className={`py-3 rounded-xl border text-sm font-medium transition-all ${
                  bodyPart === part 
                  ? 'bg-[#E13038]/10 border-[#E13038] text-[#E13038]' 
                  : 'bg-[#222] border-[#333] text-gray-400 hover:border-gray-500'
                }`}
              >
                {part}
              </button>
            ))}
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-300">Foto del Ejercicio</label>
          
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all flex flex-col items-center justify-center p-6 ${
              imagePreview 
              ? 'border-[#E13038] bg-black relative h-48' 
              : 'border-[#333] hover:border-[#555] bg-[#222] h-40'
            }`}
          >
            {imagePreview ? (
              <>
                <img src={imagePreview} alt="Preview" className="w-full h-full object-contain absolute inset-0" />
                <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white font-medium flex items-center"><Upload className="w-5 h-5 mr-2"/> Cambiar Foto</p>
                </div>
              </>
            ) : (
              <>
                <ImageIcon className="w-10 h-10 text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm text-center">Toca para seleccionar o hacer una foto</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 w-full max-w-[480px] left-1/2 -translate-x-1/2 p-4 bg-gradient-to-t from-[#121212] via-[rgba(18,18,18,0.9)] to-transparent z-20 pb-safe">
        <div className="flex w-full gap-3">
          {id && (
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isSaving || isDeleting}
              className="w-16 h-14 bg-[#222] border border-[#444] text-[#E13038] rounded-full shadow-lg flex-shrink-0 flex items-center justify-center transition-all hover:bg-[#333] active:scale-[0.95]"
            >
              <Trash2 className="w-6 h-6" />
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={!name.trim() || isSaving || isDeleting}
            className="flex-1 h-14 bg-[#E13038] text-white font-bold px-6 rounded-full shadow-lg flex items-center justify-center transition-all disabled:opacity-50 hover:bg-[#c2242a] active:scale-[0.98]"
          >
            {isSaving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>{id ? 'Actualizando...' : 'Guardando...'}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="w-6 h-6" />
                <span>{id ? 'ACTUALIZAR' : 'GUARDAR EJERCICIO'}</span>
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Premium Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1A1A1A] border border-[#333] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl scale-in-center">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                <Trash2 className="w-8 h-8 text-[#E13038]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">¿Eliminar ejercicio?</h3>
              <p className="text-gray-400 text-sm mb-6">
                Esta acción borrará "{name}" permanentemente de la biblioteca. Los PDF ya generados no se verán afectados.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-[#222] text-white rounded-xl font-medium hover:bg-[#333] transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 py-3 bg-[#E13038] text-white rounded-xl font-medium shadow-[0_4px_15px_rgba(225,48,56,0.3)] flex items-center justify-center hover:bg-[#c2242a] transition-colors disabled:opacity-50"
                >
                  {isDeleting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    'Eliminar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
