-- Add AC AUTOMOVEIS user
INSERT INTO "AUTORIZAÇÃO" (id_empresa, nome_empresa, nome_usuario, email, senha, telefone, plano, status, cargo)
VALUES (2, 'AC AUTOMOVEIS', 'Administrador AC', 'acveiculos@admin.com.br', 'acveiculos2025', '(11) 98888-7777', 'premium', 'ativo', 'gestor')
ON CONFLICT (email) DO UPDATE SET
  senha = EXCLUDED.senha,
  status = EXCLUDED.status,
  cargo = EXCLUDED.cargo;

-- Add some sample team members for AC AUTOMOVEIS
INSERT INTO "AUTORIZAÇÃO" (id_empresa, nome_empresa, nome_usuario, email, senha, telefone, plano, status, cargo)
VALUES 
  (2, 'AC AUTOMOVEIS', 'Carlos Vendedor', 'carlos@acveiculos.com.br', 'carlos123', '(11) 97777-6666', 'gratuito', 'ativo', 'vendedor'),
  (2, 'AC AUTOMOVEIS', 'Ana SDR', 'ana@acveiculos.com.br', 'ana123', '(11) 96666-5555', 'gratuito', 'ativo', 'sdr')
ON CONFLICT (email) DO NOTHING;

-- Add some sample leads for AC AUTOMOVEIS
INSERT INTO "BASE_DE_LEADS" (id_empresa, nome_lead, telefone, email, origem, vendedor, veiculo_interesse, resumo_qualificacao, estagio_lead, resumo_comercial)
VALUES 
  (2, 'Ricardo Almeida', '(11) 99123-4567', 'ricardo@email.com', 'Instagram', 'Carlos Vendedor', 'Chevrolet Onix', 'Cliente interessado em veículo semi-novo', 'oportunidade', 'Primeiro contato via WhatsApp'),
  (2, 'Fernanda Costa', '(11) 98234-5678', 'fernanda@email.com', 'Site', 'Carlos Vendedor', 'Ford Ka', 'Cliente busca entrada facilitada', 'em_qualificacao', 'Análise de crédito em andamento'),
  (2, 'Paulo Mendes', '(11) 97345-6789', 'paulo@email.com', 'WhatsApp', 'Carlos Vendedor', 'Volkswagen Gol', 'Troca + financiamento', 'qualificado', 'Veículo avaliado, aguardando aprovação'),
  (2, 'Juliana Lima', '(11) 96456-7890', 'juliana@email.com', 'Facebook', 'Ana SDR', 'Fiat Argo', 'Lead qualificado SDR', 'follow_up', 'Reagendar test drive')
ON CONFLICT DO NOTHING;
