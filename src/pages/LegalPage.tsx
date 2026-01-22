import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';

const LegalPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-[#F3F4F6] dark:bg-[#1F2128] pb-10 transition-colors font-sans text-gray-900 dark:text-white">
            <div className="px-6 pt-6">
                <TopHeader
                    title="Legal"
                    subtitle="Términos y Privacidad"
                    onBack={() => navigate(-1)}
                />

                <div className="max-w-2xl mx-auto space-y-6 pt-4">
                    <section className="bg-white dark:bg-[#2A2D3A] p-6 rounded-[2rem] shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-[#FF1F40]">Términos y Condiciones</h2>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300 mb-4">
                            Bienvenido a Almodovar Box. Al utilizar nuestra aplicación, aceptas cumplir con los siguientes términos de servicio.
                            Nos reservamos el derecho de modificar estos términos en cualquier momento.
                        </p>
                        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <li>El uso de la app es personal e intransferible.</li>
                            <li>Debes respetar las normas de convivencia del Box.</li>
                            <li>Las reservas deben cancelarse con la antelación estipulada.</li>
                        </ul>
                    </section>

                    <section className="bg-white dark:bg-[#2A2D3A] p-6 rounded-[2rem] shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-[#FF1F40]">Política de Privacidad</h2>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            En Almodovar Box nos tomamos muy en serio tu privacidad. Recopilamos solo los datos necesarios para
                            gestionar tu suscripción y tus reservas. No compartimos tu información con terceros sin tu consentimiento.
                        </p>
                    </section>

                    <section className="bg-white dark:bg-[#2A2D3A] p-6 rounded-[2rem] shadow-sm">
                        <h2 className="text-xl font-bold mb-4 text-[#FF1F40]">Contacto Legal</h2>
                        <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            Para cualquier duda legal, contáctanos en admin@almodovarbox.com
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default LegalPage;
