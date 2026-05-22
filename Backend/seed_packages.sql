CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    price NUMERIC,
    price_suffix VARCHAR(50),
    description TEXT,
    features JSONB,
    is_popular BOOLEAN DEFAULT false
);

INSERT INTO packages (name, price, price_suffix, description, features, is_popular) VALUES 
('Privéles', 120, '/ 2 uur', '1-op-1 begeleiding voor maximale progressie. Ideaal voor absolute beginners of als je specifieke tricks wilt leren.', '["1 instructeur, 1 cursist", "Inclusief alle gear", "Video analyse (optioneel)"]', false), 
('Duo Les', 85, 'p.p. / 3 uur', 'Samen leren kiten met een vriend of partner. Je deelt een kite en leert van elkaars fouten.', '["1 instructeur, 2 cursisten", "Gedeelde kite setup", "Ideaal voor koppels"]', false), 
('Groepsles', 110, 'p.p. / 3.5 uur', 'De meest gekozen lesvorm. Gezellig leren in een klein groepje met een toegankelijke prijs.', '["Max 3 cursisten per instructeur", "Focus op de basis", "Veel theorie in praktijk"]', true), 
('5-Daagse Cursus', 399, '/ 15 uur', 'Van nul naar onafhankelijk kiter in één week. Een compleet traject inclusief IKO certificering.', '["5 lessen van 3 uur", "Gegarandeerd meters maken", "Inclusief IKO pasje"]', false);
