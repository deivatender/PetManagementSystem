-- =============================================================================
-- Pet Management System v1 — idempotent development seed
--
-- Safe to run repeatedly: uses INSERT ... ON DUPLICATE KEY UPDATE keyed on
-- deterministic ids so re-running does not create duplicate rows. Intended for
-- local/dev only — do NOT run against production data.
-- =============================================================================

-- Owners ----------------------------------------------------------------------
INSERT INTO owners (id, full_name, email, phone, address) VALUES
    (1, 'Jane Smith',   'jane@example.com',  '555-0100', '42 Elm Street, Springfield'),
    (2, 'Carlos Ramos', 'carlos@example.com','555-0142', '7 Maple Ave, Riverton'),
    (3, 'Aisha Khan',   NULL,                '555-0199', NULL)
AS new
ON DUPLICATE KEY UPDATE
    full_name = new.full_name,
    email     = new.email,
    phone     = new.phone,
    address   = new.address;

-- Pets ------------------------------------------------------------------------
INSERT INTO pets (id, name, species, breed, date_of_birth, gender, status, owner_id) VALUES
    (1, 'Max',    'Dog',     'Labrador',        '2020-05-15', 'Male',    'Active',   1),
    (2, 'Luna',   'Cat',     'Siamese',         '2021-09-01', 'Female',  'Active',   1),
    (3, 'Kiwi',   'Bird',    'Budgerigar',      '2022-03-20', 'Unknown', 'Active',   2),
    (4, 'Shelly', 'Reptile', 'Red-eared slider','2019-07-10', 'Female',  'Inactive', 3),
    (5, 'Buddy',  'Dog',     NULL,              NULL,         'Male',    'Rehomed',  NULL)
AS new
ON DUPLICATE KEY UPDATE
    name          = new.name,
    species       = new.species,
    breed         = new.breed,
    date_of_birth = new.date_of_birth,
    gender        = new.gender,
    status        = new.status,
    owner_id      = new.owner_id;
