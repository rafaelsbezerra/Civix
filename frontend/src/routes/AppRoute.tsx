import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';
import Login from '@/pages/login';
import CatalogoEmpresas from '@/pages/CatalogoEmpresas';
import PerfilEmpresa from '@/pages/PerfilEmpresa';
import NotFound from '@/pages/PageError';
import { PublicSmoothScroll } from '@/components/layout/PublicSmoothScroll';
import FirstAccess from '@/pages/FirstAccess';

export const AppRoutes: React.FC = () => (
    <>
        <PublicSmoothScroll />
        <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/catalogo" element={<CatalogoEmpresas />} />
            <Route path="/empresa/:id" element={<PerfilEmpresa />} />
            <Route path="/primeiro-acesso" element={<FirstAccess />} />


            <Route path='*' element={<NotFound />} />
        </Routes>
    </>
);
