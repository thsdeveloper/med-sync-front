'use client';

import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/organisms/Footer';
import {
    Shield,
    Database,
    Lock,
    UserCheck,
    FileText,
    Mail,
    Clock,
    Server,
    Smartphone,
    Building2
} from 'lucide-react';

export default function PoliticasDePrivacidade() {
    return (
        <main className="min-h-screen bg-slate-50">
            {/* Header Simples */}
            <header className="bg-white border-b border-slate-100 py-4">
                <div className="container mx-auto px-6">
                    <nav className="flex justify-between items-center">
                        <Link href="/" className="flex items-center gap-2 group">
                            <div className="relative w-10 h-10">
                                <svg className="w-full h-full text-blue-600 transform group-hover:rotate-180 transition-transform duration-700" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 4V20M4 12H20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                                    <path d="M18 8L21 5M21 5L17 5M21 5L21 9" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M6 16L3 19M3 19L7 19M3 19L3 15" stroke="#2DD4BF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            <span className="font-heading font-bold text-2xl text-slate-800 tracking-tight">Med<span className="text-blue-600">Sync</span></span>
                        </Link>
                        <Link
                            href="/"
                            className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
                        >
                            Voltar ao Início
                        </Link>
                    </nav>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-16 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                <div className="container mx-auto px-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-teal-400/10 text-teal-400 px-4 py-2 rounded-full text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        Transparência e Segurança
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                        Política de{' '}
                        <span className="bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                            Privacidade
                        </span>
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        Sua privacidade é nossa prioridade. Entenda como coletamos, utilizamos e protegemos seus dados.
                    </p>
                    <p className="text-slate-500 text-sm mt-4">
                        Última atualização: 09 de Dezembro de 2024
                    </p>
                </div>
            </section>

            {/* Conteúdo Principal */}
            <section className="py-16">
                <div className="container mx-auto px-6 max-w-4xl">

                    {/* Introdução */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">1. Introdução</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    A <strong>MedSync Tecnologia</strong> (&quot;nós&quot;, &quot;nosso&quot; ou &quot;MedSync&quot;) está comprometida em proteger a privacidade e os dados pessoais de nossos usuários. Esta Política de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações quando você utiliza nossa plataforma de gestão de escalas médicas.
                                </p>
                                <p className="text-slate-600 leading-relaxed">
                                    Esta política se aplica a todos os serviços oferecidos pelo MedSync, incluindo nosso aplicativo móvel para profissionais de saúde e nossa plataforma web para organizações de saúde.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Dados Coletados */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-teal-100 p-3 rounded-xl">
                                <Database className="w-6 h-6 text-teal-600" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">2. Dados que Coletamos</h2>

                                {/* Profissionais de Saúde */}
                                <div className="bg-slate-50 rounded-xl p-6 mb-4">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Smartphone className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold text-slate-900">Profissionais de Saúde (App Mobile)</h3>
                                    </div>
                                    <ul className="space-y-2 text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>CRM (Registro Profissional):</strong> Utilizado para autenticação e validação de credenciais médicas</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Nome Completo:</strong> Para identificação na plataforma</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Email:</strong> Gerado automaticamente a partir do CRM para comunicações do sistema</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Token de Notificações Push:</strong> Para envio de alertas sobre plantões e escalas</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Histórico de Plantões:</strong> Registro de escalas aceitas, check-ins e check-outs</span>
                                        </li>
                                    </ul>
                                </div>

                                {/* Organizações */}
                                <div className="bg-slate-50 rounded-xl p-6">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Building2 className="w-5 h-5 text-blue-600" />
                                        <h3 className="font-semibold text-slate-900">Organizações de Saúde (Plataforma Web)</h3>
                                    </div>
                                    <ul className="space-y-2 text-slate-600">
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Razão Social e CNPJ:</strong> Para identificação legal da organização</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Dados de Contato:</strong> Email, telefone e endereço</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-teal-500 mt-1">•</span>
                                            <span><strong>Informações de Unidades:</strong> Clínicas, hospitais e setores cadastrados</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Finalidade */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-purple-100 p-3 rounded-xl">
                                <UserCheck className="w-6 h-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">3. Finalidade do Tratamento</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    Utilizamos seus dados para as seguintes finalidades:
                                </p>
                                <ul className="space-y-3 text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 font-bold">1.</span>
                                        <span><strong>Prestação de Serviços:</strong> Gerenciar escalas, plantões e trocas de turnos</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 font-bold">2.</span>
                                        <span><strong>Autenticação:</strong> Validar credenciais profissionais (CRM) e controlar acesso</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 font-bold">3.</span>
                                        <span><strong>Comunicações:</strong> Enviar notificações sobre plantões, alertas e atualizações</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 font-bold">4.</span>
                                        <span><strong>Relatórios:</strong> Gerar relatórios de presença e estatísticas para organizações</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-purple-500 font-bold">5.</span>
                                        <span><strong>Melhoria do Serviço:</strong> Analisar uso para aprimorar a plataforma</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Base Legal LGPD */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-amber-100 p-3 rounded-xl">
                                <FileText className="w-6 h-6 text-amber-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">4. Base Legal (LGPD)</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    O tratamento de dados pessoais pelo MedSync está fundamentado nas seguintes bases legais da Lei Geral de Proteção de Dados (Lei nº 13.709/2018):
                                </p>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-slate-900 mb-2">Execução de Contrato</h4>
                                        <p className="text-sm text-slate-600">Para prestação dos serviços de gestão de escalas contratados</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-slate-900 mb-2">Legítimo Interesse</h4>
                                        <p className="text-sm text-slate-600">Para melhoria contínua dos serviços e segurança da plataforma</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-slate-900 mb-2">Consentimento</h4>
                                        <p className="text-sm text-slate-600">Para envio de notificações push e comunicações opcionais</p>
                                    </div>
                                    <div className="bg-amber-50 rounded-xl p-4">
                                        <h4 className="font-semibold text-slate-900 mb-2">Obrigação Legal</h4>
                                        <p className="text-sm text-slate-600">Para cumprimento de exigências regulatórias do setor de saúde</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Segurança */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-green-100 p-3 rounded-xl">
                                <Lock className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">5. Segurança dos Dados</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    Implementamos medidas técnicas e organizacionais para proteger seus dados:
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4">
                                        <Server className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Infraestrutura Segura</h4>
                                            <p className="text-sm text-slate-600">Dados armazenados em servidores Supabase com criptografia em repouso e em trânsito (HTTPS/TLS)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4">
                                        <Smartphone className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Armazenamento Local Seguro</h4>
                                            <p className="text-sm text-slate-600">Credenciais armazenadas no dispositivo usando Expo SecureStore (criptografia nativa do sistema operacional)</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 bg-green-50 rounded-xl p-4">
                                        <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-slate-900">Controle de Acesso</h4>
                                            <p className="text-sm text-slate-600">Autenticação baseada em CRM com políticas de segurança em nível de banco de dados (RLS)</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Compartilhamento */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-blue-100 p-3 rounded-xl">
                                <Building2 className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">6. Compartilhamento de Dados</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    Seus dados podem ser compartilhados nas seguintes situações:
                                </p>
                                <ul className="space-y-3 text-slate-600">
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span><strong>Com Organizações Contratantes:</strong> Hospitais e clínicas têm acesso aos dados de plantões e presença dos profissionais vinculados</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span><strong>Prestadores de Serviços:</strong> Supabase (banco de dados), serviços de notificação push</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-blue-500 mt-1">•</span>
                                        <span><strong>Por Obrigação Legal:</strong> Quando exigido por lei ou ordem judicial</span>
                                    </li>
                                </ul>
                                <p className="text-slate-600 leading-relaxed mt-4">
                                    <strong>Não vendemos ou comercializamos seus dados pessoais para terceiros.</strong>
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Direitos do Titular */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-indigo-100 p-3 rounded-xl">
                                <UserCheck className="w-6 h-6 text-indigo-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">7. Seus Direitos (LGPD)</h2>
                                <p className="text-slate-600 leading-relaxed mb-4">
                                    Conforme a LGPD, você possui os seguintes direitos:
                                </p>
                                <div className="grid md:grid-cols-2 gap-3">
                                    {[
                                        'Confirmação da existência de tratamento',
                                        'Acesso aos seus dados pessoais',
                                        'Correção de dados incompletos ou desatualizados',
                                        'Anonimização, bloqueio ou eliminação de dados',
                                        'Portabilidade dos dados',
                                        'Eliminação de dados tratados com consentimento',
                                        'Informação sobre compartilhamento',
                                        'Revogação do consentimento'
                                    ].map((direito, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-indigo-50 rounded-lg p-3">
                                            <span className="text-indigo-500">✓</span>
                                            <span className="text-sm text-slate-700">{direito}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Retenção de Dados */}
                    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100 mb-8">
                        <div className="flex items-start gap-4">
                            <div className="bg-slate-100 p-3 rounded-xl">
                                <Clock className="w-6 h-6 text-slate-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-4">8. Retenção de Dados</h2>
                                <p className="text-slate-600 leading-relaxed">
                                    Mantemos seus dados pessoais pelo tempo necessário para cumprir as finalidades descritas nesta política,
                                    ou conforme exigido por lei. Dados de plantões e histórico profissional podem ser mantidos por períodos
                                    mais longos para fins de auditoria e compliance no setor de saúde. Após o término da relação contratual,
                                    os dados serão eliminados ou anonimizados, exceto quando a retenção for necessária para cumprimento de
                                    obrigações legais.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Contato */}
                    <div className="bg-gradient-to-br from-blue-600 to-teal-500 rounded-2xl p-8 text-white">
                        <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-xl">
                                <Mail className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold mb-4">9. Contato</h2>
                                <p className="text-blue-100 leading-relaxed mb-4">
                                    Para exercer seus direitos ou esclarecer dúvidas sobre esta política, entre em contato:
                                </p>
                                <div className="bg-white/10 rounded-xl p-4 space-y-2">
                                    <p><strong>MedSync Tecnologia</strong></p>
                                    <p>Encarregado de Proteção de Dados (DPO)</p>
                                    <p className="flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        <a href="mailto:privacidade@medsync.com.br" className="underline hover:no-underline">
                                            privacidade@medsync.com.br
                                        </a>
                                    </p>
                                </div>
                                <p className="text-blue-100 text-sm mt-4">
                                    Responderemos sua solicitação em até 15 dias úteis, conforme previsto na LGPD.
                                </p>
                            </div>
                        </div>
                    </div>

                </div>
            </section>

            <Footer />
        </main>
    );
}
