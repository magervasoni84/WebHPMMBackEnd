create TABLE users (
    id SERIAl PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


INSERT INTO users (name, email) VALUES
 ('Jhon Doe', 'email@ejemplo.com'),
 ('Natalia', 'email@ejemplo.com');

 select * from users;