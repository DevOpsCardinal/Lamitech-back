/* =====================================================================
   Diagnostico (solo lectura) - ejecutar DESPUES de la migracion 001.
   No modifica nada. Sirve para decidir si hace falta recalcular historicos.
   ===================================================================== */

/* 1. Trailers con mas de una fila abierta: sintoma del bug de casing
      'culminado' que permitia insertar duplicados. */
SELECT Trailer, COUNT(*) AS Filas_Abiertas
FROM   dbo.Trailers
WHERE  Culminado = 0
GROUP BY Trailer
HAVING COUNT(*) > 1
ORDER BY Filas_Abiertas DESC;

/* 2. Comparacion del Peso_Trailer guardado contra el que resulta de las dos
      determinaciones. Las filas con diferencia grande son las que la formula
      recursiva vieja dejo corruptas. */
SELECT  Trailer, Fecha_Entrada, Placa_Entrada, Placa_Salida,
        Peso_Entrada, taraCab1, Peso_Salida, taraCab2,
        Peso_Trailer AS Peso_Guardado,
        CASE WHEN Peso_Entrada IS NOT NULL AND taraCab1 IS NOT NULL
                  AND Peso_Entrada - taraCab1 > 0
             THEN Peso_Entrada - taraCab1 END AS Determinacion_Entrada,
        CASE WHEN Peso_Salida IS NOT NULL AND taraCab2 IS NOT NULL
                  AND Peso_Salida - taraCab2 > 0
             THEN Peso_Salida - taraCab2 END AS Determinacion_Salida
FROM    dbo.Trailers
ORDER BY Fecha_Entrada DESC;

/* 3. Cuantos despachos e ingresos quedarian sin VGM por no tener
      Tara_Contenedor o Neto. */
SELECT 'Despachos' AS Tabla,
       COUNT(*) AS Total,
       SUM(CASE WHEN Tara_Contenedor IS NULL OR Neto IS NULL THEN 1 ELSE 0 END) AS Sin_Datos_Para_Vgm
FROM   dbo.Despachos
UNION ALL
SELECT 'Ingresos', COUNT(*),
       SUM(CASE WHEN Tara_Contenedor IS NULL OR Neto IS NULL THEN 1 ELSE 0 END)
FROM   dbo.Ingresos;
