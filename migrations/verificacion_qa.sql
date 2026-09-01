/* =====================================================================
   Verificacion de QA - ejecutar DESPUES de cada caso de prueba manual.
   Solo lectura. Requiere las migraciones 001 y 002 aplicadas.
   Reemplazar 'R-QA-01' por el numero de trailer usado.
   ===================================================================== */

DECLARE @Trailer VARCHAR(50) = 'R-QA-01';

/* --- 1. Estado del trailer ------------------------------------------
   Peso_Trailer debe ser el promedio de las determinaciones GUARDADAS.
   Un extremo que iba cargado no aporta determinacion y su columna queda
   en NULL a proposito: con el trailer lleno la resta deja trailer mas
   mercancia y no hay forma de separarlas con un solo pesaje. */
SELECT  Trailer,
        Placa_Entrada, Peso_Entrada, taraCab1, Peso_Trailer_Entrada,
        Placa_Salida,  Peso_Salida,  taraCab2, Peso_Trailer_Salida,
        Peso_Trailer  AS Promedio_Guardado,
        Diferencia_Determinaciones,
        Culminado,
        CASE
          WHEN Peso_Trailer_Entrada IS NOT NULL AND Peso_Trailer_Salida IS NOT NULL
            THEN (Peso_Trailer_Entrada + Peso_Trailer_Salida) / 2
          ELSE COALESCE(Peso_Trailer_Entrada, Peso_Trailer_Salida)
        END           AS Promedio_Esperado,
        CASE
          WHEN Peso_Trailer = CASE
                 WHEN Peso_Trailer_Entrada IS NOT NULL AND Peso_Trailer_Salida IS NOT NULL
                   THEN (Peso_Trailer_Entrada + Peso_Trailer_Salida) / 2
                 ELSE COALESCE(Peso_Trailer_Entrada, Peso_Trailer_Salida)
               END THEN 'SI'
          WHEN Peso_Trailer IS NULL
               AND Peso_Trailer_Entrada IS NULL
               AND Peso_Trailer_Salida IS NULL THEN 'SI (sin determinar)'
          ELSE 'NO <<< REVISAR'
        END           AS Coinciden
FROM    dbo.Trailers
WHERE   Trailer = @Trailer
ORDER BY Fecha_Entrada DESC, Hora_Entrada DESC;

/* --- 2. Una sola fila abierta por trailer ---------------------------
   Debe devolver 0 filas. Si devuelve alguna, volvieron los duplicados
   que causaba el bug de casing en Culminado. */
SELECT Trailer, COUNT(*) AS Filas_Abiertas
FROM   dbo.Trailers
WHERE  Culminado = 0
GROUP BY Trailer
HAVING COUNT(*) > 1;

/* --- 3. Ningun peso corrupto ----------------------------------------
   Debe devolver 0 filas. Detecta negativos y ceros: la formula vieja los
   producia, y ahora un valor no determinable debe quedar en NULL. */
SELECT Trailer, Fecha_Entrada, Peso_Trailer, Peso_Trailer_Entrada, Peso_Trailer_Salida
FROM   dbo.Trailers
WHERE  Peso_Trailer <= 0
    OR Peso_Trailer_Entrada <= 0
    OR Peso_Trailer_Salida  <= 0;

/* --- 4. Carga y VGM del tiquete -------------------------------------
   VGM = Tara_Contenedor + Carga, donde Carga ya descuenta el peso del
   trailer en los movimientos de recoger. Sin contenedor no se declara
   VGM y ambas columnas deben quedar en NULL o cero. */
SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor, Fecha_Entrada AS Proceso,
       Neto, Carga, Tara_Contenedor, Vgm,
       CASE
         WHEN LTRIM(RTRIM(ISNULL(No_Contenedor,''))) = ''
           THEN CASE WHEN Vgm IS NULL THEN 'SI (sin contenedor, sin VGM)'
                     ELSE 'NO <<< no deberia declarar VGM' END
         WHEN Vgm = Tara_Contenedor + Carga THEN 'SI'
         ELSE 'NO <<< REVISAR'
       END AS Coinciden
FROM   dbo.Despachos
ORDER BY No_Tiquete DESC;

SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor, Fecha_Entrada AS Proceso,
       Neto, Carga, Tara_Contenedor, Vgm,
       CASE
         WHEN LTRIM(RTRIM(ISNULL(No_Contenedor,''))) = ''
           THEN CASE WHEN Vgm IS NULL THEN 'SI (sin contenedor, sin VGM)'
                     ELSE 'NO <<< no deberia declarar VGM' END
         WHEN Vgm = Tara_Contenedor + Carga THEN 'SI'
         ELSE 'NO <<< REVISAR'
       END AS Coinciden
FROM   dbo.Ingresos
ORDER BY No_Tiquete DESC;

/* --- 5. En los movimientos de recoger, la carga descuenta el trailer -
   Carga debe ser Neto menos el peso del trailer del viaje. Si Carga es
   igual al Neto en un Recoger_Trailer con contenedor, no se descontó. */
SELECT TOP (10)
       d.No_Tiquete, d.No_R, d.No_Contenedor,
       d.Neto, t.Peso_Trailer, d.Carga,
       d.Neto - t.Peso_Trailer AS Carga_Esperada,
       CASE WHEN d.Carga = d.Neto - t.Peso_Trailer THEN 'SI'
            ELSE 'NO <<< REVISAR' END AS Coinciden
FROM   dbo.Despachos d
       JOIN dbo.Trailers t ON t.Trailer = d.No_R
WHERE  d.Fecha_Entrada = 'Recoger_Trailer'
  AND  LTRIM(RTRIM(ISNULL(d.No_Contenedor,''))) <> ''
  AND  t.Peso_Trailer IS NOT NULL
ORDER BY d.No_Tiquete DESC;

/* --- 6. Seguimiento de la diferencia entre determinaciones ----------
   Correr tras unas semanas. Sirve para fijar la tolerancia con cifras
   reales. Solo aparecen los viajes con los dos extremos vacios, que son
   los unicos que producen dos determinaciones. */
SELECT  COUNT(*)                        AS Viajes_Con_Dos_Determinaciones,
        MIN(Diferencia_Determinaciones) AS Diferencia_Minima,
        AVG(Diferencia_Determinaciones) AS Diferencia_Promedio,
        MAX(Diferencia_Determinaciones) AS Diferencia_Maxima
FROM    dbo.Trailers
WHERE   Diferencia_Determinaciones IS NOT NULL;
