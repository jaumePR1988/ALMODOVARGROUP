import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileDown, Users, Calendar, TrendingUp, DollarSign, Activity, FileText } from 'lucide-react';
import TopHeader from './TopHeader';
// @ts-ignore
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

const AdminReports = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        activeClasses: 0,
        totalReservations: 0,
        monthlyRevenue: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Basic counts (Simulation for real data since we might not have all collections populated perfectly yet)
            const usersSnap = await getDocs(collection(db, 'users'));
            const classesSnap = await getDocs(collection(db, 'classes'));
            const resSnap = await getDocs(collection(db, 'reservations'));

            setStats({
                totalUsers: usersSnap.size,
                activeClasses: classesSnap.size,
                totalReservations: resSnap.size,
                monthlyRevenue: usersSnap.size * 55 // Simulated avg ticket
            });
        } catch (error) {
            console.error("Error fetching report data", error);
        }
    };

    const handleExportPDF = () => {
        setLoading(true);
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString('es-ES');

        // HEADER BRANDING
        doc.setFillColor(31, 33, 40); // Dark Background
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(255, 31, 64); // Brand Red
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("ALMODOVAR BOX", 105, 20, { align: "center" });

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text("REPORTE MENSUAL DE RENDIMIENTO", 105, 30, { align: "center" });

        // METRICS SUMMARY
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(`Fecha de Emisión: ${dateStr}`, 15, 55);
        doc.text("Resumen General:", 15, 65);

        // Simple Metrics Table
        autoTable(doc, {
            startY: 70,
            head: [['Métrica', 'Valor']],
            body: [
                ['Socios Activos', stats.totalUsers],
                ['Clases Programadas', stats.activeClasses],
                ['Reservas Totales', stats.totalReservations],
                ['Ingresos Estimados (Mensual)', `${stats.monthlyRevenue} €`]
            ],
            theme: 'grid',
            headStyles: { fillColor: [31, 33, 40], textColor: [255, 255, 255] },
            styles: { fontSize: 11, cellPadding: 4 },
        });

        // FOOTER
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        doc.text("Este documento es confidencial y para uso exclusivo de la administración.", 105, finalY, { align: "center" });

        doc.save(`Reporte_Almodovar_${new Date().toISOString().split('T')[0]}.pdf`);
        setLoading(false);
    };

    const StatCard = ({ icon: Icon, label, value, color }: any) => (
        <div className="bg-white dark:bg-[#2A2D3A] p-6 rounded-3xl shadow-lg border border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
                <p className="text-gray-400 text-xs font-black uppercase tracking-wider mb-1">{label}</p>
                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-1">{value}</h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color} bg-opacity-20`}>
                <Icon size={24} className={color.replace('bg-', 'text-')} />
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#1F2128] pb-24 transition-colors font-sans">
            <div className="px-6 pt-6">
                <TopHeader
                    title="Reportes"
                    subtitle="Estadísticas y Métricas"
                    onBack={() => navigate('/admin')} // "Ir atrás" functionality
                />

                {/* KPI GRID */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                    <StatCard icon={Users} label="Socios Totales" value={stats.totalUsers} color="text-blue-500 bg-blue-500" />
                    <StatCard icon={TrendingUp} label="Ingresos Est." value={`${stats.monthlyRevenue}€`} color="text-green-500 bg-green-500" />
                    <StatCard icon={Calendar} label="Clases Activas" value={stats.activeClasses} color="text-purple-500 bg-purple-500" />
                    <StatCard icon={Activity} label="Reservas" value={stats.totalReservations} color="text-orange-500 bg-orange-500" />
                </div>

                {/* PDF EXPORT SECTION */}
                <div className="bg-gradient-to-br from-[#FF1F40] to-[#b3142c] rounded-[2.5rem] p-8 text-white shadow-2xl shadow-red-900/40 relative overflow-hidden mb-6">
                    <FileText className="absolute -right-10 -top-10 text-white/10 w-48 h-48 rotate-12" />
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black italic uppercase leading-none mb-2">Exportar Informe</h2>
                        <p className="text-white/80 text-sm font-medium mb-6 max-w-xs">
                            Genera un PDF profesional con el resumen de métricas, asistencias y rendimiento mensual del Box.
                        </p>
                        <button
                            onClick={handleExportPDF}
                            disabled={loading}
                            className="bg-white text-[#FF1F40] px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-3 shadow-lg active:scale-95 transition-all w-full justify-center"
                        >
                            {loading ? (
                                <span className="animate-spin">⌛</span>
                            ) : (
                                <FileDown size={18} />
                            )}
                            {loading ? 'Generando...' : 'Descargar PDF'}
                        </button>
                    </div>
                </div>

                {/* Recent Activity List / Mock */}
                <h3 className="px-2 text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Actividad Reciente</h3>
                <div className="bg-white dark:bg-[#2A2D3A] rounded-[2rem] p-4 shadow-sm">
                    {[1, 2, 3].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-0">
                            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                                <Activity size={16} className="text-gray-400" />
                            </div>
                            <div>
                                <p className="text-sm font-bold dark:text-white">Cierre de Caja Diario</p>
                                <p className="text-xs text-gray-400">Hace {i + 2} horas • Automático</p>
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    );
};

export default AdminReports;
