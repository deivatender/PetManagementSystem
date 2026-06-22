-- =============================================================================
-- Pet Management System v1 — initial schema (raw DDL reference)
-- Engine: MySQL 8.x  |  Charset: utf8mb4  |  Collation: utf8mb4_unicode_ci
--
-- This file mirrors the Alembic migration `001_initial_schema` 1:1 and exists as
-- a human-readable / DevOps reference. Alembic remains the source of truth for
-- applying schema changes; do not hand-run this in an Alembic-managed env.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- owners
-- -----------------------------------------------------------------------------
CREATE TABLE owners (
    id          INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    full_name   VARCHAR(150)      NOT NULL,
    email       VARCHAR(255)      NULL,
    phone       VARCHAR(20)       NULL,
    address     VARCHAR(255)      NULL,
    created_at  DATETIME(6)       NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at  DATETIME(6)       NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                  ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE  KEY uq_owners_email    (email),
    INDEX       idx_owners_name    (full_name),
    INDEX       idx_owners_phone   (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- pets
-- -----------------------------------------------------------------------------
CREATE TABLE pets (
    id            INT UNSIGNED      NOT NULL AUTO_INCREMENT,
    name          VARCHAR(100)      NOT NULL,
    species       ENUM('Dog','Cat','Bird','Rabbit','Reptile','Other') NOT NULL,
    breed         VARCHAR(100)      NULL,
    date_of_birth DATE              NULL,
    gender        ENUM('Male','Female','Unknown') NULL,
    status        ENUM('Active','Inactive','Deceased','Rehomed')
                                    NOT NULL DEFAULT 'Active',
    owner_id      INT UNSIGNED      NULL,
    created_at    DATETIME(6)       NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at    DATETIME(6)       NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
                                    ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    CONSTRAINT fk_pets_owner
        FOREIGN KEY (owner_id) REFERENCES owners(id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE,
    INDEX idx_pets_owner_id (owner_id),
    INDEX idx_pets_name     (name),
    INDEX idx_pets_breed    (breed),
    INDEX idx_pets_species  (species),
    INDEX idx_pets_status   (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
