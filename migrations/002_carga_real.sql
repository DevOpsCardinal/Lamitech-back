/* =====================================================================
   Migracion 002 - Carga real del movimiento
   Base de datos: Lamitech        Esquema asumido: dbo
   Requiere la migracion 001 aplicada.
   ---------------------------------------------------------------------
   Solo agrega una columna NULL-able por tabla. Idempotente.

   Por que: cuando un vehiculo entra sin trailer y sale con el, el neto
   (bruto - tara) incluye el peso del trailer. La carga real descuenta ese
   peso, y de ella sale el VGM. Se persiste junto al tiquete para que la
   reimpresion muestre lo declarado y no un recalculo.
   ===================================================================== */

SET XACT_ABORT ON;
BEGIN TRANSACTION;

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Despachos') AND name = 'Carga')
    ALTER TABLE dbo.Despachos ADD Carga INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Ingresos') AND name = 'Carga')
    ALTER TABLE dbo.Ingresos ADD Carga INT NULL;

COMMIT TRANSACTION;
GO

SELECT t.name AS Tabla, c.name AS Columna, ty.name AS Tipo, c.is_nullable AS Admite_Null
FROM   sys.columns c
       JOIN sys.tables t  ON t.object_id = c.object_id
       JOIN sys.types  ty ON ty.user_type_id = c.user_type_id
WHERE  t.name IN ('Despachos','Ingresos') AND c.name = 'Carga'
ORDER BY t.name;
GO
