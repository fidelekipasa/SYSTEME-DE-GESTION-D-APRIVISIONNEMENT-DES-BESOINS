-- Insertion des utilisateurs par défaut si la table est vide
INSERT IGNORE INTO users (username, password, email, full_name, role, address, phone) 
VALUES 
('cashier', '$2a$10$rS.H8kgpzbwqbvWYC5K1H.HrQwvpxjKZB3.bAWoqo7p9h5YY5fEHi', 'cashier@bank.com', 'Caissier Principal', 'ROLE_CASHIER', '456 Cashier Avenue', '+0987654321'),
('director', '$2a$10$rS.H8kgpzbwqbvWYC5K1H.HrQwvpxjKZB3.bAWoqo7p9h5YY5fEHi', 'director@bank.com', 'Directeur Agence', 'ROLE_DIRECTOR', '789 Director Street', '+1122334455');

-- Insertion des catégories de dépenses par défaut
INSERT IGNORE INTO expense_category (name, color) 
VALUES 
('Alimentation', '#FF6384'),
('Transport', '#36A2EB'),
('Logement', '#FFCE56'),
('Loisirs', '#4BC0C0'),
('Santé', '#9966FF'),
('Autres', '#FF9F40'); 
