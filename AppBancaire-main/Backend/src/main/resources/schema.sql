-- Création de la table users
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    full_name VARCHAR(100),
    role VARCHAR(20),
    address VARCHAR(255),
    phone VARCHAR(20),
    agency_id BIGINT,
    CONSTRAINT fk_user_agency FOREIGN KEY (agency_id) REFERENCES agencies(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Création de la table account
CREATE TABLE IF NOT EXISTS account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    balance DOUBLE NOT NULL,
    user_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Création de la table expense_category
CREATE TABLE IF NOT EXISTS expense_category (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    color VARCHAR(20)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Création de la table transaction
CREATE TABLE IF NOT EXISTS transaction (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    amount DOUBLE NOT NULL,
    type VARCHAR(10) NOT NULL,
    description VARCHAR(255),
    date TIMESTAMP,
    account_id BIGINT,
    from_account VARCHAR(50),
    to_account VARCHAR(50),
    category_id BIGINT,
    FOREIGN KEY (account_id) REFERENCES account(id),
    FOREIGN KEY (category_id) REFERENCES expense_category(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Supprimer et recréer la table virement_programme
DROP TABLE IF EXISTS virement_programme;

CREATE TABLE virement_programme (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    compte_source_id BIGINT,
    numero_compte_destination VARCHAR(50) NOT NULL,
    beneficiaire_name VARCHAR(100),
    montant DOUBLE NOT NULL,
    date_execution TIMESTAMP,
    executed BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'EN_ATTENTE',
    refus_reason VARCHAR(255),
    FOREIGN KEY (compte_source_id) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Création de la table bank_cards
CREATE TABLE IF NOT EXISTS bank_cards (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    card_number VARCHAR(19) UNIQUE NOT NULL,
    card_type VARCHAR(10) NOT NULL,
    account_id BIGINT,
    expiration_date DATE NOT NULL,
    cvv VARCHAR(3) NOT NULL,
    FOREIGN KEY (account_id) REFERENCES account(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ajout des colonnes email, phone et address dans la table users
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address VARCHAR(255);

-- Ajout de la colonne status dans la table account
ALTER TABLE account 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';

-- Ajouter cette table
CREATE TABLE IF NOT EXISTS cashier_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    amount DOUBLE,
    account_number VARCHAR(50),
    user_name VARCHAR(100),
    status VARCHAR(20) NOT NULL,
    details TEXT,
    cashier_id BIGINT,
    FOREIGN KEY (cashier_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Création de la table agencies
CREATE TABLE IF NOT EXISTS agencies (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    director_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (director_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;