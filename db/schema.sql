-- Whiskey Reservation App — Azure SQL schema
-- Compatible with Azure SQL (uses IDENTITY, NVARCHAR, DATETIME2)

IF OBJECT_ID('whiskey_orders', 'U') IS NOT NULL DROP TABLE whiskey_orders;
IF OBJECT_ID('whiskeys',       'U') IS NOT NULL DROP TABLE whiskeys;

CREATE TABLE whiskeys (
  id          INT             IDENTITY(1,1) PRIMARY KEY,
  name        NVARCHAR(100)   NOT NULL,
  category    NVARCHAR(100)   NOT NULL,
  origin      NVARCHAR(100)   NOT NULL,
  description NVARCHAR(255)   NULL,
  price       NVARCHAR(50)    NULL,
  icon        NVARCHAR(50)    NULL
);

CREATE TABLE whiskey_orders (
  id               INT            IDENTITY(1,1) PRIMARY KEY,
  whiskey_id       INT            NOT NULL,
  whiskey_name     NVARCHAR(100)  NOT NULL,
  customer_name    NVARCHAR(200)  NOT NULL,
  phone            NVARCHAR(50)   NOT NULL,
  reservation_time DATETIME2      NOT NULL,
  quantity         INT            NOT NULL DEFAULT 1,
  cancel_token     NVARCHAR(64)   NULL,
  created          DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT fk_orders_whiskey
    FOREIGN KEY (whiskey_id) REFERENCES whiskeys(id)
    ON DELETE CASCADE
);

CREATE INDEX ix_orders_time ON whiskey_orders (reservation_time);
