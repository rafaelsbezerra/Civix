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

export const AppRoutes: React.FC = () => (
    <MotionRoot>
        <PublicSmoothScroll />
        <CompanyPageTransition />
        <Routes>
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
