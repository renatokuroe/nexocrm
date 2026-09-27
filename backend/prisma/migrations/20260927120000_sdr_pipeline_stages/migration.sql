-- Rename the default sales pipeline to the SDR pipeline, keeping stage ids
-- (and the deals in them) by position. Stages already renamed are untouched.
UPDATE `stages` SET `name` = 'Tentativa de conexão', `color` = '#f97316' WHERE `name` = 'Qualificação' AND `order` = 2;
UPDATE `stages` SET `name` = 'Conexão estabelecida', `color` = '#f59e0b' WHERE `name` = 'Proposta' AND `order` = 3;
UPDATE `stages` SET `name` = 'Reunião agendada', `color` = '#3b82f6' WHERE `name` = 'Negociação' AND `order` = 4;
UPDATE `stages` SET `name` = 'No Show', `color` = '#ef4444' WHERE `name` = 'Fechado (Ganho)' AND `order` = 5;
UPDATE `stages` SET `name` = 'Reunião realizada', `color` = '#10b981' WHERE `name` = 'Fechado (Perdido)' AND `order` = 6;
