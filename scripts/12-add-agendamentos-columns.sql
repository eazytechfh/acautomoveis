-- Add missing columns to AGENDAMENTOS table for tracking actions and visit history
ALTER TABLE "AGENDAMENTOS" 
ADD COLUMN IF NOT EXISTS data_acao TIMESTAMP,
ADD COLUMN IF NOT EXISTS usuario_acao VARCHAR(255),
ADD COLUMN IF NOT EXISTS motivo_nao_fechou TEXT;

-- Create HISTORICO_VISITAS table for tracking visit history
CREATE TABLE IF NOT EXISTS "HISTORICO_VISITAS" (
  id SERIAL PRIMARY KEY,
  id_empresa INTEGER NOT NULL,
  id_agendamento INTEGER NOT NULL,
  id_lead INTEGER NOT NULL,
  nome_lead VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  vendedor VARCHAR(255),
  data_agendamento DATE,
  hora_agendamento TIME,
  status_visita VARCHAR(50) NOT NULL,
  data_hora_acao TIMESTAMP NOT NULL,
  usuario_acao VARCHAR(255),
  motivo TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (id_agendamento) REFERENCES "AGENDAMENTOS"(id) ON DELETE CASCADE,
  FOREIGN KEY (id_lead) REFERENCES "BASE_DE_LEADS"(id) ON DELETE CASCADE
);

-- Create index for faster queries on historico visitas
CREATE INDEX IF NOT EXISTS idx_historico_visitas_empresa ON "HISTORICO_VISITAS"(id_empresa);
CREATE INDEX IF NOT EXISTS idx_historico_visitas_data ON "HISTORICO_VISITAS"(data_hora_acao);
CREATE INDEX IF NOT EXISTS idx_historico_visitas_status ON "HISTORICO_VISITAS"(status_visita);
