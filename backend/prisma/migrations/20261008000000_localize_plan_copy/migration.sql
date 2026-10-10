UPDATE plans
SET description = 'Presença profissional para começar a crescer.',
    features = '["Perfil no catálogo", "Contato de clientes"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'inicial';

UPDATE plans
SET description = 'Mais visibilidade e recursos para sua empresa.',
    features = '["Perfil em destaque", "Contato de clientes", "Relatórios básicos"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'profissional';

UPDATE plans
SET description = 'Recursos completos para operar em escala.',
    features = '["Perfil em destaque", "Relatórios avançados", "Suporte prioritário"]'::jsonb,
    updated_at = NOW()
WHERE slug = 'premium';
