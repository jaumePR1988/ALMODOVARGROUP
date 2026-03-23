import React, { useState, useRef } from 'react';
import { X, Clock, MapPin, Users, FileText, Upload, CheckCircle2, XCircle, Search, Plus } from 'lucide-react';

interface ClassData {
    id: string;
    title: string;
    description?: string;
    imageUrl?: string;
    coachId?: string;
    coachName: string;
    category: string;
    startTime: string;
    capacity: number;
    wodUrl?: string;
    wodName?: string;
    isRecurring?: boolean;
    recurringDays?: number[];
    specificDate?: string;
    [key: string]: any;
}

interface Reservation {
    id: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    classId: string;
    classDate: string;
    status: string;
    [key: string]: any;
}

interface ClassDetailModalProps {
    isOpen: boolean;
    onClose: () => void;
    classData: ClassData | null;
    selectedDate: Date;
    role: 'user' | 'coach' | 'admin';
    // User props
    isBooked?: boolean;
    onReserve?: (classData: ClassData) => void;
    onCancelReservation?: (classData: ClassData) => void;
    bookingLoading?: boolean;
    bookingError?: string | null;
    bookingSuccess?: boolean;
    reservationStatus?: string;
    isWaitlisted?: boolean;
    isWaitlistInvited?: boolean;
    waitlistPosition?: number | null;
    onJoinWaitlist?: (classData: ClassData) => void;
    waitlistLoading?: boolean;
    lockedSpots?: number;
    // Coach/Admin props
    attendees?: Reservation[];
    onUploadWod?: (file: File) => Promise<void>;
    uploadingWod?: boolean;
    onToggleAttendance?: (reservationId: string, status: string) => void;
    availableUsers?: any[];
    onAddAttendee?: (userId: string, userName: string, userPhoto?: string) => Promise<void>;
}

const ClassDetailModal: React.FC<ClassDetailModalProps> = ({
    isOpen,
    onClose,
    classData,
    selectedDate,
    role,
    isBooked = false,
    onReserve,
    onCancelReservation,
    bookingLoading = false,
    bookingError = null,
    bookingSuccess = false,
    reservationStatus,
    isWaitlisted = false,
    isWaitlistInvited = false,
    waitlistPosition = null,
    onJoinWaitlist,
    waitlistLoading = false,
    lockedSpots,
    attendees = [],
    onUploadWod,
    uploadingWod = false,
    onToggleAttendance,
    availableUsers,
    onAddAttendee
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isPastClass = () => {
        if (!classData || !classData.startTime || !selectedDate) return false;
        const now = new Date();
        const classDateTime = new Date(selectedDate);
        const [hours, minutes] = classData.startTime.split(':').map(Number);
        classDateTime.setHours(hours, minutes, 0, 0);
        return classDateTime < now;
    };
    const isPast = isPastClass();

    if (!isOpen || !classData) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0 && onUploadWod) {
            await onUploadWod(e.target.files[0]);
        }
    };

    const dateStr = selectedDate.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:px-4 pb-0 sm:pb-4 animate-in fade-in duration-200">
            <div className="absolute inset-0" onClick={() => !bookingLoading && !uploadingWod && onClose()} />
            
            <div className="w-full sm:max-w-[480px] bg-[#111111] rounded-t-[32px] sm:rounded-[32px] border-t sm:border border-[#333] overflow-hidden relative z-10 flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-full sm:slide-in-from-bottom-10 duration-300">
                {/* Image Header */}
                <div className="relative h-48 sm:h-56 shrink-0 bg-[#1c1b1b]">
                    {classData.imageUrl ? (
                        <img src={classData.imageUrl} alt={classData.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <span className="text-[#E13038] font-black text-4xl tracking-widest opacity-20 uppercase">{classData.category}</span>
                        </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-[#111111]/60 to-transparent" />
                    
                    {/* Close Button */}
                    <button 
                        onClick={onClose}
                        disabled={bookingLoading || uploadingWod}
                        className="absolute top-4 right-4 w-8 h-8 bg-black/50 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-colors z-20"
                    >
                        <X size={16} />
                    </button>

                    {/* Badge Category */}
                    <div className="absolute top-4 left-4 z-20">
                        <span className="text-[10px] font-black uppercase tracking-widest text-white bg-[#E13038] px-3 py-1.5 rounded-lg shadow-lg">
                            {classData.category}
                        </span>
                    </div>

                    {/* Title & Coach (Absolute bottom of header) */}
                    <div className="absolute bottom-4 left-6 right-6 z-20">
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-white leading-none mb-2">
                            {classData.title}
                        </h2>
                        <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-[#E13038]" />
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">
                                Coach <span className="text-white">{classData.coachName}</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto hide-scrollbar p-6">
                    {/* Time & Capacity Row */}
                    <div className="flex items-center justify-between bg-[#1c1b1b] border border-[#333] rounded-2xl p-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#E13038]/10 flex items-center justify-center text-[#E13038]">
                                <Clock size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Hora</p>
                                <p className="text-lg font-black text-white">{classData.startTime}</p>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-[#333]" />
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#2a2a2a] flex items-center justify-center text-gray-400">
                                <Users size={20} />
                            </div>
                            <div>
                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ocupación</p>
                                <p className="text-lg font-black text-white">
                                    {(role === 'coach' || role === 'admin') ? attendees.length : (isBooked ? 1 : 0)} <span className="text-gray-500 text-sm">/ {classData.capacity}</span>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {classData.description && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E13038] mb-2 flex items-center gap-2">
                                <FileText size={14} />
                                Descripción
                            </h3>
                            <p className="text-sm text-gray-400 leading-relaxed">
                                {classData.description}
                            </p>
                        </div>
                    )}

                    {/* WOD Document Section (For Users) */}
                    {role === 'user' && classData.wodUrl && isBooked && (
                        <div className="mb-6 bg-[#E13038]/5 border border-[#E13038]/20 rounded-2xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#E13038]/10 rounded-lg text-[#E13038]">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-widest text-white">WOD / Entrenamiento</h4>
                                    <p className="text-[10px] text-gray-400 font-medium">Documento adjunto por el coach</p>
                                </div>
                            </div>
                            <a 
                                href={classData.wodUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-[#E13038] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#c92a32] transition-colors"
                            >
                                Abrir
                            </a>
                        </div>
                    )}

                    {/* WOD Document Upload Section (For Coach/Admin) */}
                    {(role === 'coach' || role === 'admin') && (
                        <div className="mb-6">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E13038] mb-3 flex items-center gap-2">
                                <Upload size={14} />
                                Adjuntar Sesión (WOD)
                            </h3>
                            <div className="bg-[#1c1b1b] border border-[#333] border-dashed rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                                {classData.wodUrl ? (
                                    <>
                                        <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-3">
                                            <CheckCircle2 size={24} />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Archivo Subido</h4>
                                        <a href={classData.wodUrl} target="_blank" rel="noreferrer" className="text-xs text-[#E13038] hover:underline mb-4 truncate w-full max-w-[200px]">
                                            {classData.wodName || 'Ver Documento'}
                                        </a>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingWod}
                                            className="px-4 py-2 bg-[#2a2a2a] text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-[#333] transition-colors"
                                        >
                                            {uploadingWod ? 'Subiendo...' : 'Reemplazar Archivo'}
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-12 h-12 bg-[#2a2a2a] text-gray-500 rounded-full flex items-center justify-center mb-3">
                                            <Upload size={24} />
                                        </div>
                                        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Subir WOD</h4>
                                        <p className="text-[10px] text-gray-500 font-medium mb-4">Sube un PDF o imagen con la sesión de hoy.</p>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={uploadingWod}
                                            className="px-6 py-2.5 bg-[#E13038] text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-[#E13038]/20 hover:bg-[#c92a32] transition-colors active:scale-95 disabled:opacity-50"
                                        >
                                            {uploadingWod ? 'Subiendo...' : 'Seleccionar Archivo'}
                                        </button>
                                    </>
                                )}
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept=".pdf,image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Attendees List (For Coach/Admin) */}
                    {(role === 'coach' || role === 'admin') && (
                        <div className="mb-4">
                            <h3 className="text-xs font-bold uppercase tracking-widest text-[#E13038] mb-3 flex items-center justify-between">
                                <span className="flex items-center gap-2"><Users size={14} /> Asistentes ({attendees.length})</span>
                            </h3>

                            {/* Search and Add User block */}
                            {onAddAttendee && availableUsers && (
                                <div className="mb-4 relative">
                                    <div className="relative mb-2">
                                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                        <input 
                                            type="text" 
                                            placeholder="Buscar alumno para apuntar..." 
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-[#1c1b1b] border border-[#333] rounded-xl pl-10 pr-4 py-3 text-sm text-white focus:outline-none focus:border-[#E13038] transition-colors shadow-inner"
                                        />
                                    </div>
                                    {searchTerm && (
                                        <div className="absolute bottom-full mb-2 left-0 right-0 z-50 bg-[#1c1b1b] border border-[#333] rounded-xl overflow-hidden max-h-48 overflow-y-auto shadow-[0_-10px_40px_rgba(0,0,0,0.8)] hide-scrollbar">
                                            {availableUsers
                                                .filter(u => 
                                                    !attendees.find(a => a.userId === u.id) &&
                                                    ((u.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                    (u.apellidos || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                                                    (u.email || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                                )
                                                .slice(0, 8)
                                                .map(u => (
                                                    <div key={u.id} className="flex flex-row items-center justify-between p-3 border-b border-[#333] hover:bg-[#2a2a2a] transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-sm font-black text-white">{u.nombre} {u.apellidos}</span>
                                                            <span className="text-[10px] text-gray-500">{u.email}</span>
                                                        </div>
                                                        <button 
                                                            onClick={async () => {
                                                                await onAddAttendee(u.id, `${u.nombre || ''} ${u.apellidos || ''}`.trim() || 'Desconocido', u.photoURL);
                                                                setSearchTerm('');
                                                            }}
                                                            className="flex items-center gap-1 bg-[#E13038]/10 text-[#E13038] hover:bg-[#E13038] hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-colors active:scale-95"
                                                        >
                                                            <Plus size={14} /> Añadir
                                                        </button>
                                                    </div>
                                                ))
                                            }
                                        </div>
                                    )}
                                </div>
                            )}
                            {attendees.length === 0 ? (
                                <div className="bg-[#1c1b1b] border border-[#333] rounded-2xl p-6 text-center">
                                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Nadie se ha apuntado aún</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {attendees.map(user => {
                                        const isAttended = user.status === 'attended';
                                        const isMissed = user.status === 'missed';
                                        return (
                                        <div key={user.id} className="flex items-center justify-between gap-3 bg-[#1c1b1b] border border-[#333] p-3 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-[#2a2a2a] overflow-hidden shrink-0">
                                                    {user.userPhoto ? (
                                                        <img src={user.userPhoto} alt={user.userName} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-500 font-bold uppercase">
                                                            {user.userName?.charAt(0) || 'U'}
                                                        </div>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-white">{user.userName}</p>
                                                    <p className={`text-[10px] font-bold uppercase tracking-widest ${isAttended ? 'text-green-500' : isMissed ? 'text-red-500' : 'text-gray-500'}`}>
                                                        {isAttended ? 'Asistió' : isMissed ? 'No Asistió' : 'Pendiente'}
                                                    </p>
                                                </div>
                                            </div>
                                            
                                            {(role === 'coach' || role === 'admin') && onToggleAttendance && (
                                                <div className="flex gap-2">
                                                    <button 
                                                        onClick={() => onToggleAttendance(user.id, 'attended')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isAttended ? 'bg-green-500 text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-green-500'}`}
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => onToggleAttendance(user.id, 'missed')}
                                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isMissed ? 'bg-[#E13038] text-white' : 'bg-[#2a2a2a] text-gray-400 hover:text-[#E13038]'}`}
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )})}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Action (For User) */}
                {role === 'user' && (
                    <div className="p-6 border-t border-[#333] bg-[#111111] shrink-0">
                        {/* Status Messages */}
                        {bookingError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-widest p-3 rounded-xl mb-4 text-center">
                                {bookingError}
                            </div>
                        )}

                        {bookingSuccess ? (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-bold uppercase tracking-widest p-4 rounded-xl text-center flex flex-col items-center justify-center">
                                <CheckCircle2 size={24} className="mb-2" />
                                ¡Reserva Confirmada!
                            </div>
                        ) : isBooked ? (
                            isPast ? (
                                <div className="w-full py-4 bg-[#1c1b1b] rounded-xl border border-[#333] text-center flex flex-col items-center justify-center">
                                    {reservationStatus === 'attended' ? (
                                        <span className="text-green-500 font-bold uppercase text-xs flex items-center gap-2"><CheckCircle2 size={16}/> Asistida</span>
                                    ) : reservationStatus === 'missed' ? (
                                        <span className="text-[#E13038] font-bold uppercase text-xs flex items-center gap-2"><XCircle size={16}/> No Asistida</span>
                                    ) : (
                                        <span className="text-gray-400 font-bold uppercase text-xs">Clase Finalizada</span>
                                    )}
                                </div>
                            ) : (
                                <button
                                    onClick={() => onCancelReservation && onCancelReservation(classData)}
                                    disabled={bookingLoading}
                                    className="w-full py-4 bg-[#1c1b1b] text-gray-400 font-black uppercase tracking-widest rounded-xl border border-[#333] hover:text-white hover:border-[#E13038] transition-all disabled:opacity-50 flex justify-center items-center"
                                >
                                    {bookingLoading ? (
                                        <div className="w-5 h-5 border-2 border-gray-400 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        "Cancelar Reserva"
                                    )}
                                </button>
                            )
                        ) : isPast ? (
                            <div className="w-full py-4 bg-[#1c1b1b] text-gray-500 font-black uppercase tracking-widest rounded-xl text-center flex justify-center items-center">
                                Clase Finalizada
                            </div>
                        ) : isWaitlistInvited ? (
                            <button
                                onClick={() => onReserve && onReserve(classData)}
                                disabled={bookingLoading}
                                className="w-full py-4 bg-green-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-green-400 shadow-lg shadow-green-500/20 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                            >
                                {bookingLoading ? (
                                    <div className="w-5 h-5 border-2 border-black/50 border-t-black rounded-full animate-spin"></div>
                                ) : (
                                    "Confirmar Reserva (Invitado)"
                                )}
                            </button>
                        ) : classData.capacity <= (lockedSpots ?? attendees.length) ? (
                            isWaitlisted ? (
                                <button
                                    disabled
                                    className="w-full py-4 bg-orange-500/20 text-orange-500 border border-orange-500/30 rounded-xl flex flex-col justify-center items-center"
                                >
                                    <span className="font-black uppercase tracking-widest text-sm mb-0.5">En Lista de Espera</span>
                                    {waitlistPosition && <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500/80">Posición: {waitlistPosition}</span>}
                                </button>
                            ) : (
                                <button
                                    onClick={() => onJoinWaitlist && onJoinWaitlist(classData)}
                                    disabled={waitlistLoading}
                                    className="w-full py-4 bg-[#1c1b1b] text-orange-500 border border-orange-500 font-black uppercase tracking-widest rounded-xl hover:bg-orange-500/10 shadow-lg shadow-orange-500/5 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
                                >
                                    {waitlistLoading ? (
                                        <div className="w-5 h-5 border-2 border-orange-500/50 border-t-orange-500 rounded-full animate-spin"></div>
                                    ) : (
                                        "Unirse a Lista de Espera"
                                    )}
                                </button>
                            )
                        ) : (
                            <button
                                onClick={() => onReserve && onReserve(classData)}
                                disabled={bookingLoading}
                                className="w-full py-4 bg-[#E13038] text-white font-black uppercase tracking-widest rounded-xl hover:bg-[#c92a32] shadow-lg shadow-[#E13038]/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex justify-center items-center"
                            >
                                {bookingLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    "Reservar Clase (1 Crédito)"
                                )}
                            </button>
                        )}
                        <p className="text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">
                            {dateStr}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassDetailModal;
