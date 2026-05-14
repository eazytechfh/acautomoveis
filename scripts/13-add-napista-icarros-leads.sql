-- Add sample leads with "Na Pista" and "ICarros" origins for AC AUTOMOVEIS
-- This will make these channels appear in the Dashboard "Canais de Origem" section

INSERT INTO "BASE_DE_LEADS" (id_empresa, nome_lead, telefone, email, origem, vendedor, veiculo_interesse, valor, estagio_lead, observacao_vendedor)
VALUES 
  -- Na Pista leads
  (2, 'Marcos Silva', '(11) 95485136298', 'marcos.silva@email.com', 'Na Pista', 'Carlos Vendedor', 'Volkswagen GOL PLUS G4 1.0 8V 2006', 95000.00, 'oportunidade', 'Lead capturado da plataforma Na Pista'),
  (2, 'Carla Souza', '(11) 94567-8901', 'carla.souza@email.com', 'Na Pista', 'Carlos Vendedor', 'Chevrolet Onix 1.0', 65000.00, 'em_qualificacao', 'Interesse em financiamento'),
  (2, 'Roberto Dias', '(11) 93456-7890', 'roberto.dias@email.com', 'Na Pista', 'Ana SDR', 'Ford Ka SE 1.0', 55000.00, 'em_negociacao', 'Negociando condições de pagamento'),
  (2, 'Patricia Rocha', '(11) 92345-6789', 'patricia.rocha@email.com', 'Na Pista', 'Carlos Vendedor', 'Fiat Uno Vivace', 48000.00, 'follow_up', 'Aguardando retorno do cliente'),
  
  -- ICarros leads  
  (2, 'Eduardo Santos', '(11) 91234-5678', 'eduardo.santos@email.com', 'ICarros', 'Carlos Vendedor', 'Honda Civic 2.0', 125000.00, 'oportunidade', 'Lead capturado da plataforma ICarros'),
  (2, 'Luciana Martins', '(11) 90123-4567', 'luciana.martins@email.com', 'ICarros', 'Ana SDR', 'Toyota Corolla XEI', 110000.00, 'em_qualificacao', 'Cliente interessado em test drive'),
  (2, 'Felipe Costa', '(11) 99012-3456', 'felipe.costa@email.com', 'ICarros', 'Carlos Vendedor', 'Hyundai HB20 1.6', 78000.00, 'qualificado', 'Documentação em análise'),
  (2, 'Amanda Ferreira', '(11) 98901-2345', 'amanda.ferreira@email.com', 'ICarros', 'Ana SDR', 'Renault Sandero', 62000.00, 'fechado', 'Venda concluída')
ON CONFLICT DO NOTHING;
