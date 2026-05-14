-- Adicionar novas colunas na tabela AGENDAMENTOS para rastreamento de ações
ALTER TABLE "AGENDAMENTOS" ADD COLUMN IF NOT EXISTS data_acao TIMESTAMP;
ALTER TABLE "AGENDAMENTOS" ADD COLUMN IF NOT EXISTS usuario_acao VARCHAR(255);
ALTER TABLE "AGENDAMENTOS" ADD COLUMN IF NOT EXISTS motivo_nao_fechou TEXT;

-- Atualizar os estágios válidos para incluir novos estágios
ALTER TABLE "AGENDAMENTOS" DROP CONSTRAINT IF EXISTS agendamentos_estagio_check;
ALTER TABLE "AGENDAMENTOS" ADD CONSTRAINT agendamentos_estagio_check 
  CHECK (estagio_agendamento IN (
    'agendar', 
    'agendado', 
    'realizou_visita', 
    'vendedor_vitor',
    'vendedor_anderson',
    'desmarcou',
    'fechou', 
    'nao_fechou'
  ));

-- Criar função para sincronizar leads da etapa "em_negociacao" automaticamente
CREATE OR REPLACE FUNCTION sync_leads_to_agendamentos()
RETURNS TRIGGER AS $$
BEGIN
  -- Quando um lead move para "em_negociacao", criar agendamento automaticamente
  IF NEW.estagio_lead = 'em_negociacao' AND (OLD.estagio_lead IS NULL OR OLD.estagio_lead != 'em_negociacao') THEN
    INSERT INTO "AGENDAMENTOS" (
      id_empresa,
      id_lead,
      nome_lead,
      telefone,
      email,
      modelo_veiculo,
      vendedor,
      id_vendedor,
      estagio_agendamento,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id_empresa,
      NEW.id,
      NEW.nome_lead,
      NEW.telefone,
      NEW.email,
      NEW.veiculo_interesse,
      NEW.vendedor,
      (SELECT id FROM "VENDEDORES" WHERE vendedor = NEW.vendedor AND id_empresa = NEW.id_empresa LIMIT 1),
      'agendar',
      NOW(),
      NOW()
    )
    ON CONFLICT (id_lead) DO UPDATE SET
      telefone = EXCLUDED.telefone,
      email = EXCLUDED.email,
      modelo_veiculo = EXCLUDED.modelo_veiculo,
      vendedor = EXCLUDED.vendedor,
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para sincronização automática
DROP TRIGGER IF EXISTS sync_leads_trigger ON "BASE_DE_LEADS";
CREATE TRIGGER sync_leads_trigger
  AFTER INSERT OR UPDATE ON "BASE_DE_LEADS"
  FOR EACH ROW
  EXECUTE FUNCTION sync_leads_to_agendamentos();

-- Adicionar constraint unique para evitar duplicação
ALTER TABLE "AGENDAMENTOS" ADD CONSTRAINT IF NOT EXISTS agendamentos_id_lead_unique UNIQUE (id_lead);

-- Criar tabela de histórico de visitas
CREATE TABLE IF NOT EXISTS "HISTORICO_VISITAS" (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER NOT NULL,
  id_agendamento INTEGER REFERENCES "AGENDAMENTOS"(id) ON DELETE CASCADE,
  id_lead INTEGER NOT NULL,
  nome_lead VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  vendedor VARCHAR(255),
  data_agendamento TIMESTAMP,
  hora_agendamento VARCHAR(10),
  status_visita VARCHAR(50) NOT NULL CHECK (status_visita IN ('realizou_visita', 'nao_realizou_visita', 'nao_fechou', 'desmarcou')),
  data_hora_acao TIMESTAMP NOT NULL DEFAULT NOW(),
  usuario_acao VARCHAR(255),
  motivo TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Criar índices para melhorar performance nas consultas de histórico
CREATE INDEX IF NOT EXISTS idx_historico_visitas_empresa ON "HISTORICO_VISITAS"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_historico_visitas_data ON "HISTORICO_VISITAS"(data_hora_acao);
CREATE INDEX IF NOT EXISTS idx_historico_visitas_status ON "HISTORICO_VISITAS"(status_visita);
CREATE INDEX IF NOT EXISTS idx_historico_visitas_vendedor ON "HISTORICO_VISITAS"(vendedor);

-- Sincronizar leads existentes em "em_negociacao" para agendamentos
INSERT INTO "AGENDAMENTOS" (
  id_empresa,
  id_lead,
  nome_lead,
  telefone,
  email,
  modelo_veiculo,
  vendedor,
  id_vendedor,
  estagio_agendamento,
  created_at,
  updated_at
)
SELECT 
  l.id_empresa,
  l.id,
  l.nome_lead,
  l.telefone,
  l.email,
  l.veiculo_interesse,
  l.vendedor,
  (SELECT v.id FROM "VENDEDORES" v WHERE v.vendedor = l.vendedor AND v.id_empresa = l.id_empresa LIMIT 1),
  'agendar',
  NOW(),
  NOW()
FROM "BASE_DE_LEADS" l
WHERE l.estagio_lead = 'em_negociacao'
ON CONFLICT (id_lead) DO NOTHING;
