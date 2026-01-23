import React, { useState, useEffect } from 'react';
import {
    Megaphone,
    Bell,
    Plus,
    Trash2,
    Image as ImageIcon,
    Loader2,
    Bold,
    Italic,
    List,
    AlertCircle,
    Info
} from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import BottomNavigation from './BottomNavigation';

const NewsModule = () => {
    const [activeTab, setActiveTab] = useState('todo');
    const [news, setNews] = useState<any[]>([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);

    // Create Form State
    const [newTitle, setNewTitle] = useState('');
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState('news'); // news, alert, highlight
    const [newImage, setNewImage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [validationError, setValidationError] = useState('');

    // Image Compression Helper
    const compressImage = (file: File): Promise<File> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
                const img = new Image();
                img.src = event.target?.result as string;
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    // Max dimension 800px (good balance)
                    const MAX_WIDTH = 800;
                    const scaleSize = MAX_WIDTH / img.width;
                    const width = MAX_WIDTH;
                    const height = img.height * scaleSize;

                    canvas.width = width;
                    canvas.height = height;
                    ctx?.drawImage(img, 0, 0, width, height);

                    canvas.toBlob((blob) => {
                        if (blob) {
                            resolve(new File([blob], file.name, { type: 'image/jpeg' }));
                        } else {
                            reject(new Error("Compression failed"));
                        }
                    }, 'image/jpeg', 0.7); // 70% quality
                };
            };
            reader.onerror = (error) => reject(error);
        });
    };

    useEffect(() => {
        // Check Admin Role
        const checkRole = async () => {
            // We can check the local storage or wait for a more robust check, 
            // but for UI logic, checking if navigating from /admin might be enough? 
            // Better to check the auth profile if available, or just rely on Firestore rules for security.
            // For UI visibility:
            if (auth.currentUser?.email === 'admin@almodovar.com' || localStorage.getItem('role') === 'admin') {
                setIsAdmin(true);
            }
        };
        checkRole();

        // Fetch News
        const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    const handleCreate = async () => {
        if (!newTitle.trim() || !newContent.trim()) {
            setValidationError('Título y Contenido son obligatorios');
            return;
        }
        try {
            await addDoc(collection(db, 'announcements'), {
                title: newTitle,
                content: newContent, // Contains HTML
                type: newType,
                imageUrl: newImage,
                createdAt: serverTimestamp(),
                authorId: auth.currentUser?.uid || 'admin',
                authorName: auth.currentUser?.displayName || 'Admin'
            });
            setShowCreateModal(false);
            setNewTitle('');
            setNewContent('');
            setNewType('news');
            setNewImage('');
            setValidationError('');
        } catch (error) {
            console.error("Error creating news:", error);
            setValidationError('Error al publicar. Inténtalo de nuevo.');
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const file = e.target.files[0];
        setIsUploading(true);
        setValidationError('');
        try {
            const compressedFile = await compressImage(file);
            const storageRef = ref(storage, `news-covers/${Date.now()}_${compressedFile.name}`);
            await uploadBytes(storageRef, compressedFile);
            const url = await getDownloadURL(storageRef);
            setNewImage(url);
        } catch (error) {
            console.error("Error uploading image:", error);
            setValidationError("Error al subir la imagen");
        } finally {
            setIsUploading(false);
        }
    };

    // Text Editor Helper
    const formatText = (command: string) => {
        // Simple append for now, proper RTE requires contentEditable or library
        // We will insert HTML tags
        const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = newContent;
        const before = text.substring(0, start);
        const selected = text.substring(start, end);
        const after = text.substring(end);

        let formatted = selected;
        if (command === 'bold') formatted = `<b>${selected}</b>`;
        if (command === 'italic') formatted = `<i>${selected}</i>`;

        setNewContent(before + formatted + after);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Borrar esta noticia?')) return;
        try {
            await deleteDoc(doc(db, 'announcements', id));
        } catch (e) {
            console.error(e);
        }
    };

    // Filter Logic
    // const filteredNews = activeTab === 'todo' ? news : news.filter(n => n.type === (activeTab === 'noticias' ? 'news' : 'alert'));

    // Separate by Section
    const highlights = news.filter(n => n.type === 'highlight');
    const alerts = news.filter(n => n.type === 'alert');
    const recent = news.filter(n => n.type === 'news');

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#1F2128] pb-24 font-sans transition-colors duration-300">

            {/* Header Custom */}
            <header className="px-6 pt-6 pb-4 bg-white dark:bg-[#1F2128] sticky top-0 z-50">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                        <Megaphone className="text-[#FF1F40]" size={28} />
                        <h1 className="text-2xl font-black uppercase italic dark:text-white">Noticias</h1>
                    </div>
                    {/* Admin Add Button */}
                    {isAdmin && (
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-[#FF1F40] text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
                        >
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                {/* Tabs */}
                <div className="flex gap-6 overflow-x-auto pb-2 scrollbar-hide">
                    {['Todo', 'Noticias', 'Alertas'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab.toLowerCase())}
                            className={`text-sm font-bold uppercase tracking-wide whitespace-nowrap pb-2 border-b-2 transition-colors ${activeTab === tab.toLowerCase()
                                ? 'text-[#FF1F40] border-[#FF1F40]'
                                : 'text-gray-400 border-transparent hover:text-gray-600 dark:hover:text-gray-200'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            <div className="px-4 space-y-8 mt-4">

                {/* 1. DESTACADO (Highlights) */}
                {highlights.length > 0 && (
                    <section>
                        {highlights.map(item => (
                            <div key={item.id} className="relative rounded-[2rem] overflow-hidden shadow-xl aspect-[4/3] group">
                                <img
                                    src={item.imageUrl || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop"}
                                    alt="Highlight"
                                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-6">
                                    <span className="bg-[#FF1F40] text-white text-[10px] font-black uppercase px-2 py-1 rounded w-fit mb-2">Destacado</span>
                                    <h2 className="text-white text-xl font-black uppercase italic leading-tight mb-1">{item.title}</h2>
                                    <div className="text-gray-200 text-xs line-clamp-2" dangerouslySetInnerHTML={{ __html: item.content }} />
                                </div>
                                {isAdmin && (
                                    <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-red-500 transition-colors">
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* 2. IMPORTANTE (Alerts) */}
                {(activeTab === 'todo' || activeTab === 'alertas') && alerts.length > 0 && (
                    <section>
                        <h3 className="text-sm font-black uppercase text-gray-400 mb-4 ml-2">Importante</h3>
                        <div className="space-y-4">
                            {alerts.map(item => (
                                <div key={item.id} className="bg-white dark:bg-[#2A2D3A] rounded-3xl p-5 border-l-4 border-red-500 shadow-sm flex gap-4 relative">
                                    <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/20 text-red-500 flex items-center justify-center shrink-0">
                                        <Bell size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h4>
                                            <span className="text-[10px] text-gray-400 font-medium">Hoy</span>
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
                                    </div>
                                    {isAdmin && (
                                        <button onClick={() => handleDelete(item.id)} className="absolute bottom-4 right-4 text-gray-300 hover:text-red-500">
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 3. RECIENTE (News Feed) */}
                {(activeTab === 'todo' || activeTab === 'noticias') && (
                    <section>
                        <h3 className="text-sm font-black uppercase text-gray-400 mb-4 ml-2">Reciente</h3>
                        <div className="space-y-4">
                            {recent.map(item => (
                                <div key={item.id} className="bg-white dark:bg-[#2A2D3A] rounded-[2rem] p-5 shadow-sm">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden">
                                            <img src="https://ui-avatars.com/api/?name=Admin&background=000&color=fff" alt="Admin" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black dark:text-white">Administración</p>
                                            <p className="text-[10px] text-gray-400">Hace 2 horas</p>
                                        </div>
                                    </div>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.content }} />
                                    {item.imageUrl && (
                                        <div className="rounded-xl overflow-hidden mb-3">
                                            <img src={item.imageUrl} alt="Post" className="w-full h-48 object-cover" />
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-white/5 pt-3">
                                        <button className="text-gray-400 hover:text-[#FF1F40] text-xs font-bold flex items-center gap-1">
                                            ❤️ Me gusta
                                        </button>
                                        {isAdmin && (
                                            <button onClick={() => handleDelete(item.id)} className="text-gray-300 hover:text-red-500">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </div>

            {/* CREATE MODAL */}
            {showCreateModal && (
                <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#2A2D3A] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl space-y-4">
                        <h3 className="text-lg font-black uppercase italic dark:text-white">Nueva Noticia</h3>

                        <input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="Título"
                            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-[#1F2128] border-none outline-none dark:text-white font-bold"
                        />

                        {/* Rich Text Toolbar */}
                        <div className="flex gap-2 mb-1 px-2">
                            <button onClick={() => formatText('bold')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"><Bold size={16} className="text-gray-500 dark:text-gray-300" /></button>
                            <button onClick={() => formatText('italic')} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-white/10"><Italic size={16} className="text-gray-500 dark:text-gray-300" /></button>
                        </div>
                        <textarea
                            id="content-editor"
                            value={newContent}
                            onChange={(e) => setNewContent(e.target.value)}
                            placeholder="Escribe aquí... Usa los botones para formato."
                            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-[#1F2128] border-none outline-none dark:text-white h-32 resize-none text-sm font-medium"
                        />

                        {/* Type Selection with Info */}
                        <div className="space-y-2">
                            <div className="flex gap-2">
                                {['news', 'alert', 'highlight'].map(t => (
                                    <button
                                        key={t}
                                        onClick={() => setNewType(t)}
                                        className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all ${newType === t
                                            ? 'bg-[#FF1F40] text-white shadow-lg shadow-red-500/20 scale-105'
                                            : 'bg-gray-100 dark:bg-white/5 text-gray-500'
                                            }`}
                                    >
                                        {t === 'news' ? 'Post' : t === 'alert' ? 'Alerta' : 'Hero'}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-gray-400 px-2 flex items-center gap-1">
                                <Info size={12} />
                                {newType === 'news' && 'Un post normal en el feed.'}
                                {newType === 'alert' && 'Aviso importante con borde rojo.'}
                                {newType === 'highlight' && 'Tarjeta grande con imagen de fondo.'}
                            </p>
                        </div>

                        <div className="relative">
                            <input
                                type="file"
                                id="cover-upload"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <label
                                htmlFor="cover-upload"
                                className={`w-full p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : 'hover:border-[#FF1F40] dark:hover:border-[#FF1F40]'}`}
                            >
                                {isUploading ? (
                                    <Loader2 className="animate-spin text-gray-400" size={24} />
                                ) : newImage ? (
                                    <div className="relative w-full h-32 rounded-lg overflow-hidden">
                                        <img src={newImage} alt="Preview" className="w-full h-full object-cover" />
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-bold uppercase">Cambiar Imagen</span>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <ImageIcon className="text-gray-400" size={24} />
                                        <span className="text-xs font-bold text-gray-400 uppercase">Subir Portada (Opcional)</span>
                                    </>
                                )}
                            </label>
                            {newImage && !isUploading && (
                                <button
                                    onClick={() => setNewImage('')}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md"
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3 pt-2">
                            {validationError && (
                                <div className="absolute bottom-20 left-6 right-6 text-red-500 text-xs font-bold text-center bg-red-100 dark:bg-red-500/10 p-2 rounded-lg flex items-center justify-center gap-2">
                                    <AlertCircle size={12} /> {validationError}
                                </div>
                            )}
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="flex-1 py-3 text-gray-500 font-bold uppercase text-xs hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreate}
                                disabled={isUploading}
                                className="flex-1 py-3 bg-[#FF1F40] text-white rounded-xl font-bold uppercase text-xs shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploading ? 'Subiendo...' : 'Publicar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <BottomNavigation role={isAdmin ? 'admin' : 'user'} activeTab="news" />
        </div>
    );
};

export default NewsModule;
