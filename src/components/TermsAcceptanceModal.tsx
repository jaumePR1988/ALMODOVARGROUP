import { useState, useRef } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { ScrollText, Camera, CheckCircle2 } from 'lucide-react';

interface UserData {
  uid: string;
  role: string;
  termsAccepted?: boolean;
  imageRightsAccepted?: boolean;
}

interface Props {
  userData: UserData;
}

export default function TermsAcceptanceModal({ userData }: Props) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [imageRightsAccepted, setImageRightsAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isAcceptedLocally, setIsAcceptedLocally] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (!contentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
    // Permitir un margen de 20px para la detección del final
    if (scrollTop + clientHeight >= scrollHeight - 20) {
      setHasScrolledToBottom(true);
    }
  };

  const handleAccept = async () => {
    if (!termsAccepted || !imageRightsAccepted) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        termsAccepted: true,
        imageRightsAccepted: true
      });
      // Ocultamos el modal localmente sin recargar
      setIsAcceptedLocally(true);
    } catch (error) {
      console.error('Error al actualizar términos:', error);
      setLoading(false);
    }
  };

  if (isAcceptedLocally) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#2A2D3A] rounded-[2.5rem] shadow-2xl border border-white/10 flex flex-col max-h-[90vh] overflow-hidden text-white animate-in zoom-in duration-300">
        
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-[#E13038]/10 shrink-0">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-[#E13038] flex items-center justify-center shadow-lg shadow-[#E13038]/20">
              <ScrollText className="text-white" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tight">
                Términos y <span className="text-[#E13038]">Condiciones</span>
              </h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                Acción Requerida
              </p>
            </div>
          </div>
          <p className="text-sm text-gray-300 mt-4 leading-relaxed">
            Para continuar usando la aplicación de Almodóvar Group, es obligatorio leer y aceptar nuestras condiciones de servicio y ceder los derechos de imagen. Por favor, lee hasta el final.
          </p>
        </div>

        {/* Scrollable Content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {/* Términos copiado del Login */}
          <div className="space-y-6 text-sm leading-relaxed opacity-90">
            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">1) Responsable del tratamiento</h4>
                <p><strong>Responsable:</strong> Jesús Almodóvar<br />
                    <strong>Domicilio:</strong> Av. dels Rabassaires, 30 – 2ª planta, 08100 Mollet del Vallès (Barcelona)<br />
                    <strong>Web:</strong> www.almodovargroup.es<br />
                    <strong>Correo:</strong> almodovarbox@gmail.com<br />
                    <strong>Teléfono:</strong> 662 086 632</p>
                <p className="mt-2 text-xs">“Almodóvar Group” hace referencia al conjunto de servicios ofrecidos bajo las líneas Almodóvar Fit y Almodóvar Box.</p>
            </section>

            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">2) Finalidad y Conservación</h4>
                <p>Gestión integral de la relación con clientes (altas, reservas, facturación, atención al cliente, comunicaciones). No se toman decisiones automatizadas. Los datos se conservarán mientras exista relación comercial y por los plazos legales establecidos.</p>
            </section>

            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">3) Destinatarios y Derechos</h4>
                <p>No se realizan cesiones no necesarias para el servicio, salvo obligaciones legales. Puede ejercer sus derechos de acceso, rectificación, supresión y otros en almodovarbox@gmail.com.</p>
            </section>

            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">4) Uso de la APP</h4>
                <p>El acceso implica la aceptación de estas condiciones. Usuario declara ser mayor de 18 años o estar bajo supervisión legal. Debe custodiar su contraseña.</p>
            </section>

            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">5) Condiciones Comerciales</h4>
                <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Almodóvar Box:</strong> 2 ses/sem (105€/mes), 3 ses/sem (159,90€/mes). Matrícula 59,90€.</li>
                    <li><strong>Almodóvar Fit:</strong> 2 ses/sem (54,90€/mes), 3 ses/sem (74,90€/mes). Matrícula 59,90€.</li>
                </ul>
                <p className="mt-2 text-xs font-bold text-yellow-500">Importante: Suscripción mensual no acumulable. Bajas requieren 3 meses de espera o matrícula de 150€ para re-alta.</p>
            </section>

            <section>
                <h4 className="font-black text-[#E13038] uppercase mb-2">6) Normas de Instalaciones</h4>
                <p>Uso respetuoso, limpieza del material, toalla y calzado adecuado obligatorio. Prohibido fumar o sustancias. Conductas agresivas implican expulsión inmediata.</p>
            </section>
          </div>

          <div className="h-px bg-white/10 w-full my-6"></div>

          {/* Checkboxes de Aceptación */}
          <div className="space-y-4">
            {/* Terms Checkbox */}
            <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              !hasScrolledToBottom 
                ? 'opacity-50 grayscale border-white/5 cursor-not-allowed' 
                : termsAccepted ? 'bg-[#E13038]/10 border-[#E13038]' : 'bg-black/20 border-white/10 hover:bg-black/40'
            }`}>
              <div className="mt-1 relative flex items-center justify-center shrink-0">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                  disabled={!hasScrolledToBottom}
                />
                <div className="w-6 h-6 rounded-lg border-2 border-white/20 peer-checked:border-[#E13038] peer-checked:bg-[#E13038] flex items-center justify-center transition-all opacity-100">
                  <CheckCircle2 size={16} className={`text-white transition-transform scale-0 peer-checked:scale-100 ${termsAccepted ? 'scale-100' : ''}`} />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">He leído y acepto los Términos y Condiciones</p>
                {!hasScrolledToBottom && (
                  <p className="text-xs text-[#E13038] mt-1 font-bold animate-pulse">Debes leer hasta el final para aceptar</p>
                )}
              </div>
            </label>

            {/* Image Rights Checkbox */}
            <label className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
              !hasScrolledToBottom 
                ? 'opacity-50 grayscale border-white/5 cursor-not-allowed' 
                : imageRightsAccepted ? 'bg-[#E13038]/10 border-[#E13038]' : 'bg-black/20 border-white/10 hover:bg-black/40'
            }`}>
              <div className="mt-1 relative flex items-center justify-center shrink-0">
                <input 
                  type="checkbox" 
                  className="peer sr-only"
                  checked={imageRightsAccepted}
                  onChange={(e) => setImageRightsAccepted(e.target.checked)}
                  disabled={!hasScrolledToBottom}
                />
                <div className="w-6 h-6 rounded-lg border-2 border-white/20 peer-checked:border-[#E13038] peer-checked:bg-[#E13038] flex items-center justify-center transition-all opacity-100">
                  <CheckCircle2 size={16} className={`text-white transition-transform scale-0 peer-checked:scale-100 ${imageRightsAccepted ? 'scale-100' : ''}`} />
                </div>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Camera size={14} className="text-[#E13038]" />
                  <p className="font-bold text-sm">Cesión de Derechos de Imagen</p>
                </div>
                <p className="text-xs text-gray-400">Acepto la cesión de mis derechos de imagen para fines comerciales, publicitarios y redes sociales de Almodóvar Group, sin limitación geográfica ni temporal.</p>
              </div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-black/20 shrink-0 border-t border-white/5">
          <button 
            onClick={handleAccept}
            disabled={!termsAccepted || !imageRightsAccepted || loading}
            className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest transition-all ${
              termsAccepted && imageRightsAccepted && !loading
                ? 'bg-[#E13038] hover:bg-[#D41C2B] text-white shadow-[0_10px_30px_rgba(225,48,56,0.3)] hover:shadow-[0_10px_40px_rgba(225,48,56,0.5)] active:scale-95'
                : 'bg-white/5 text-white/30 cursor-not-allowed'
            }`}
          >
            {loading ? 'Guardando...' : 'Aceptar y Entrar'}
          </button>
        </div>
      </div>
    </div>
  );
}
