/* =====================================================================
   Migracion 001 - Peso de trailer por promedio de determinaciones + VGM
   Base de datos: Lamitech        Esquema asumido: dbo
   ---------------------------------------------------------------------
   Solo agrega columnas NULL-ables. No modifica ni borra datos existentes.
   Es idempotente: se puede ejecutar varias veces sin efecto adicional.

   ANTES DE EJECUTAR: tomar respaldo completo de la base.
   ===================================================================== */

SET XACT_ABORT ON;
BEGIN TRANSACTION;

/* --- Trailers: las dos determinaciones independientes del viaje ------ */

/* Peso del trailer despejado con el cabezote que lo trajo:
   Peso_Entrada - taraCab1 */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Trailers')
                 AND name = 'Peso_Trailer_Entrada')
    ALTER TABLE dbo.Trailers ADD Peso_Trailer_Entrada INT NULL;

/* Peso del trailer despejado con el cabezote que se lo lleva:
   Peso_Salida - taraCab2 */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Trailers')
                 AND name = 'Peso_Trailer_Salida')
    ALTER TABLE dbo.Trailers ADD Peso_Trailer_Salida INT NULL;

/* Diferencia absoluta entre ambas determinaciones. Se registra como dato
   de diagnostico para poder fijar mas adelante una tolerancia con cifras
   reales. Hoy no dispara ninguna alerta ni bloquea el proceso. */
IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Trailers')
                 AND name = 'Diferencia_Determinaciones')
    ALTER TABLE dbo.Trailers ADD Diferencia_Determinaciones INT NULL;

/* --- Despachos e Ingresos: VGM declarado -----------------------------
   VGM (SOLAS cap. VI regla 2) = Tara_Contenedor + Neto.
   Se persiste el valor emitido para que la reimpresion muestre lo que se
   declaro y no un recalculo posterior. */

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Despachos')
                 AND name = 'Vgm')
    ALTER TABLE dbo.Despachos ADD Vgm INT NULL;

IF NOT EXISTS (SELECT 1 FROM sys.columns
               WHERE object_id = OBJECT_ID('dbo.Ingresos')
                 AND name = 'Vgm')
    ALTER TABLE dbo.Ingresos ADD Vgm INT NULL;

COMMIT TRANSACTION;
GO

/* --- Verificacion: las 5 columnas deben aparecer --------------------- */
SELECT  t.name AS Tabla, c.name AS Columna, ty.name AS Tipo, c.is_nullable AS Admite_Null
FROM    sys.columns c
        JOIN sys.tables  t  ON t.object_id = c.object_id
        JOIN sys.types   ty ON ty.user_type_id = c.user_type_id
WHERE  (t.name = 'Trailers'  AND c.name IN ('Peso_Trailer_Entrada',
                                            'Peso_Trailer_Salida',
                                            'Diferencia_Determinaciones'))
    OR (t.name IN ('Despachos','Ingresos') AND c.name = 'Vgm')
ORDER BY t.name, c.name;
GO
