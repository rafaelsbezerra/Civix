import React from 'react';
import { CompanyPageTransition } from '@/components/motion/CompanyPageTransition';
import { MotionRoot } from '@/components/motion/MotionRoot';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';
import Login from '@/pages/login';
import AccessChoice from '@/pages/AccessChoice';
import ClientAccess from '@/pages/ClientAccess';
import CatalogoEmpresas from '@/pages/CatalogoEmpresas';
import PerfilEmpresa from '@/pages/PerfilEmpresa';
import NotFound from '@/pages/PageError';
import { PublicSmoothScroll } from '@/components/layout/PublicSmoothScroll';
import FirstAccess from '@/pages/FirstAccess';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import { TermsOfService } from '@/pages/TermsOfServices';
import { PrivacyPolicy } from '@/pages/PrivacityPolicy';
import HelperCenter from '@/pages/HelperCenter';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
    CompanyDashboardLayout,
    OwnerDashboardRoute,
} from '@/components/dashboard/CompanyDashboardLayout';
import { CompanyDashboardHome } from '@/components/dashboard/CompanyDashboardHome';
import { DashboardSectionUnavailable } from '@/components/dashboard/DashboardSectionUnavailable';

export const AppRoutes: React.FC = () => (
    <MotionRoot>
        <PublicSmoothScroll />
        <CompanyPageTransition />
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path="/login" element={<AccessChoice />} />
            <Route path="/login/empresa" element={<Login />} />
            <Route path="/login/atendente" element={<Login access="atendente" />} />
            <Route path="/login/cliente" element={<ClientAccess />} />
            <Route path="/catalogo" element={<CatalogoEmpresas />} />
            <Route path="/empresa/:id" element={<PerfilEmpresa />} />
            <Route path="/primeiro-acesso" element={<FirstAccess />} />
            <Route path="/primeiro-acesso/:token" element={<FirstAccess />} />
            <Route path="/esqueci-senha" element={<ForgotPassword />} />
            <Route path="/redefinir-senha" element={<ResetPassword />} />
            <Route path="/termos-de-uso" element={<TermsOfService />} />
            <Route path="/politica-de-privacidade" element={<PrivacyPolicy />} />
            <Route path="/central-de-ajuda" element={<HelperCenter />} />

            <Route element={<ProtectedRoute allowedRoles={['admin_empresa']} />}>
                <Route path="/dashboard-empresa" element={<CompanyDashboardLayout />}>
                    <Route index element={<CompanyDashboardHome />} />
                    <Route path="leads" element={
                        <DashboardSectionUnavailable
                            title="Leads"
                            description="Acompanhe e organize os contatos interessados na sua empresa."
                            reason="A consulta e a gestão de leads ainda não têm uma API integrada. Por isso, não exibimos uma lista vazia que poderia ser confundida com a ausência real de leads."
                            icon="leads"
                        />
                    } />
                    <Route path="conversas" element={
                        <DashboardSectionUnavailable
                            title="Conversas"
                            description="Acompanhe os atendimentos da sua empresa."
                            reason="A API de conversas e mensagens ainda não está disponível. Nenhuma conversa, mensagem ou atribuição é simulada."
                            icon="conversations"
                        />
                    } />
                    <Route element={<OwnerDashboardRoute />}>
                        <Route path="equipe" element={
                            <DashboardSectionUnavailable
                                title="Equipe"
                                description="Consulte e administre os acessos da equipe da sua empresa."
                                reason="A gestão de integrantes ainda não possui uma API conectada ao painel. Convites, bloqueios, remoções e transferências de titularidade não estão disponíveis nesta tela."
                                icon="team"
                            />
                        } />
                        <Route path="configuracoes" element={
                            <DashboardSectionUnavailable
                                title="Empresa e configurações"
                                description="Consulte e atualize as informações empresariais."
                                reason="A consulta e a edição dos dados da própria empresa ainda não estão integradas. Nenhuma alteração é salva nesta tela."
                                icon="company"
                            />
                        } />
                    </Route>
                </Route>
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['atendente']} />}>
                <Route path="/dashboard-atendente" element={<CompanyDashboardLayout />}>
                    <Route
                        index
                        element={
                            <DashboardSectionUnavailable
                                title="Início"
                                description="Acompanhe seus atendimentos e sua rotina de trabalho."
                                reason="O conteúdo da página inicial do atendente ainda aguarda definição e integração com fontes reais. Nenhum indicador ou atendimento é simulado."
                                icon="home"
                            />
                        }
                    />
                    <Route
                        path="conversas"
                        element={
                            <DashboardSectionUnavailable
                                title="Conversas"
                                description="Consulte e responda somente atendimentos atribuídos a você."
                                reason="A API de atendimentos e mensagens ainda não está disponível. O painel não exibe conversas de outros atendentes."
                                icon="conversations"
                            />
                        }
                    />
                    <Route
                        path="historico"
                        element={
                            <DashboardSectionUnavailable
                                title="Histórico"
                                description="Consulte os atendimentos relacionados ao seu trabalho."
                                reason="O escopo do histórico após encerramento ou transferência ainda aguarda definição. Nenhum histórico é apresentado como se estivesse vazio."
                                icon="history"
                            />
                        }
                    />
                    <Route
                        path="perfil"
                        element={
                            <DashboardSectionUnavailable
                                title="Perfil"
                                description="Consulte suas informações de acesso."
                                reason="Os campos e as ações de perfil disponíveis ao atendente ainda aguardam definição e integração."
                                icon="profile"
                            />
                        }
                    />
                </Route>
            </Route>

            <Route path='*' element={<NotFound />} />
        </Routes>
    </MotionRoot>
);
