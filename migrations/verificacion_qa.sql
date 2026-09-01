/* =====================================================================
   Verificacion de QA - ejecutar DESPUES de cada caso de prueba manual.
   Solo lectura. Reemplazar 'R-QA-01' por el numero de trailer usado.
   ===================================================================== */

DECLARE @Trailer VARCHAR(50) = 'R-QA-01';

/* --- 1. Estado de la fila del trailer -------------------------------
   Peso_Trailer debe ser el promedio exacto de las dos determinaciones.
   Coinciden = 'SI' es la comprobacion clave del requerimiento. */
SELECT  Trailer,
        Placa_Entrada, Peso_Entrada, taraCab1,
        Placa_Salida,  Peso_Salida,  taraCab2,
        Peso_Trailer_Entrada,
        Peso_Trailer_Salida,
        Peso_Trailer                AS Promedio_Guardado,
        Diferencia_Determinaciones,
        Culminado,
        /* recalculo independiente para contrastar */
        CASE
          WHEN Peso_Trailer_Entrada IS NOT NULL AND Peso_Trailer_Salida IS NOT NULL
            THEN (Peso_Trailer_Entrada + Peso_Trailer_Salida) / 2
          ELSE COALESCE(Peso_Trailer_Entrada, Peso_Trailer_Salida)
        END                          AS Promedio_Esperado,
        CASE
          WHEN Peso_Trailer = CASE
                 WHEN Peso_Trailer_Entrada IS NOT NULL AND Peso_Trailer_Salida IS NOT NULL
                   THEN (Peso_Trailer_Entrada + Peso_Trailer_Salida) / 2
                 ELSE COALESCE(Peso_Trailer_Entrada, Peso_Trailer_Salida)
               END THEN 'SI' ELSE 'NO <<< REVISAR'
        END                          AS Coinciden
FROM    dbo.Trailers
WHERE   Trailer = @Trailer
ORDER BY Fecha_Entrada DESC, Hora_Entrada DESC;

/* --- 2. Una sola fila abierta por trailer ---------------------------
   Debe devolver 0 filas. Si devuelve alguna, volvieron los duplicados. */
SELECT Trailer, COUNT(*) AS Filas_Abiertas
FROM   dbo.Trailers
WHERE  Culminado = 0
GROUP BY Trailer
HAVING COUNT(*) > 1;

/* --- 3. Ningun peso corrupto ----------------------------------------
   Debe devolver 0 filas. Detecta los NaN/negativos de la formula vieja. */
SELECT Trailer, Fecha_Entrada, Peso_Trailer, Peso_Trailer_Entrada, Peso_Trailer_Salida
FROM   dbo.Trailers
WHERE  Peso_Trailer <= 0
    OR Peso_Trailer_Entrada <= 0
    OR Peso_Trailer_Salida  <= 0;

/* --- 4. VGM del tiquete ---------------------------------------------
   Vgm debe ser exactamente Tara_Contenedor + Neto. */
SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor,
       Tara_Contenedor, Neto,
       Vgm,
       Tara_Contenedor + Neto AS Vgm_Esperado,
       CASE WHEN Vgm = Tara_Contenedor + Neto THEN 'SI' ELSE 'NO <<< REVISAR' END AS Coinciden
FROM   dbo.Despachos
ORDER BY No_Tiquete DESC;

SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor,
       Tara_Contenedor, Neto,
       Vgm,
       Tara_Contenedor + Neto AS Vgm_Esperado,
       CASE WHEN Vgm = Tara_Contenedor + Neto THEN 'SI' ELSE 'NO <<< REVISAR' END AS Coinciden
FROM   dbo.Ingresos
ORDER BY No_Tiquete DESC;

/* --- 5. Seguimiento de la diferencia entre determinaciones ----------
   Correr tras unas semanas de operacion. Sirve para dos cosas:
   fijar la tolerancia con cifras reales, y detectar si las dos
   determinaciones no son comparables: si el promedio de la diferencia
   se parece al peso tipico de la carga, es que un pesaje se hizo con el
   trailer cargado y el otro vacio, y entonces promediarlas no aplica. */
SELECT  COUNT(*)                          AS Viajes_Con_Dos_Determinaciones,
        MIN(Diferencia_Determinaciones)   AS Diferencia_Minima,
        AVG(Diferencia_Determinaciones)   AS Diferencia_Promedio,
        MAX(Diferencia_Determinaciones)   AS Diferencia_Maxima
FROM    dbo.Trailers
WHERE   Diferencia_Determinaciones IS NOT NULL;
