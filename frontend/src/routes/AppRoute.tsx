import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from '@/pages/Home';
import Login from '@/pages/login';
import CatalogoEmpresas from '@/pages/CatalogoEmpresas';
import EmpresaProfile from '@/pages/PerfilEmpresa';
import NotFound from '@/pages/PageError';

export const AppRoutes: React.FC = () => (
    <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path='/catalogo' element={<CatalogoEmpresas />} />
        <Route path='/empresas/:companyName' element={<EmpresaProfile />} />

        <Route path='*' element={<NotFound />} />
    </Routes>
);