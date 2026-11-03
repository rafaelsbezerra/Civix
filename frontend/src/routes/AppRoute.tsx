import React from 'react';
import { CompanyPageTransition } from '@/components/motion/CompanyPageTransition';
import { MotionRoot } from '@/components/motion/MotionRoot';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';
import Login from '@/pages/login';
import AccessChoice from '@/pages/AccessChoice';
import ClientAccess from '@/pages/ClientAccess';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { SuperAdminLayout } from '@/components/dashboard-super-admin/layout/SuperAdminLayout';
import Overview from '@/pages/dashboard-super-admin/Overview';
import Plans from '@/pages/dashboard-super-admin/Plans';
import CompanyCreate from '@/pages/dashboard-super-admin/CompanyCreate';
import Companies from '@/pages/dashboard-super-admin/Companies';
import CompanyDetail from '@/pages/dashboard-super-admin/CompanyDetail';
import CompanyEdit from '@/pages/dashboard-super-admin/CompanyEdit';
import Sales from '@/pages/dashboard-super-admin/Sales';
import SaleCreate from '@/pages/dashboard-super-admin/SaleCreate';
import Users from '@/pages/dashboard-super-admin/Users';
import ProfileSettings from '@/pages/dashboard-super-admin/ProfileSettings';
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

export const AppRoutes: React.FC = () => (
    <MotionRoot>
        <PublicSmoothScroll />
        <CompanyPageTransition />
        <Routes>
            <Route element={<ProtectedRoute allowedRoles={['super_admin']} />}>
                <Route path="/super-admin" element={<SuperAdminLayout />}>
                    <Route index element={<Overview />} />
                    <Route path="plans" element={<Plans />} />
                    <Route path="companies/new" element={<CompanyCreate />} />
                    <Route path="companies" element={<Companies />} />
                    <Route path="companies/:companyId" element={<CompanyDetail />} />
                    <Route path="companies/:companyId/edit" element={<CompanyEdit />} />
                    <Route path="companies/:companyId/users" element={<Users />} />
                    <Route path="administrators" element={<Users />} />
                    <Route path="sales" element={<Sales />} />
                    <Route path="sales/new" element={<SaleCreate />} />
                    <Route path="settings/profile" element={<ProfileSettings />} />
                </Route>
            </Route>
            <Route path='/' element={<HomePage />} />
            <Route path="/login" element={<AccessChoice />} />
            <Route path="/login/empresa" element={<Login />} />
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

            <Route path='*' element={<NotFound />} />
        </Routes>
    </MotionRoot>
);
