/* =====================================================================
   Verificacion de QA - ejecutar DESPUES de cada caso de prueba manual.
   Solo lectura. Requiere las migraciones 001 y 002 aplicadas.
   Reemplazar 'R-QA-01' por el numero de trailer usado.

   El modelo que se valida aqui:
     - Las dos determinaciones del viaje se guardan SIEMPRE en crudo.
     - Si concuerdan dentro de la tolerancia, el trailer viajo vacio en
       los dos extremos y Peso_Trailer es su promedio.
     - Si difieren mas que la tolerancia, uno de los extremos llevaba
       mercancia y Peso_Trailer es la MENOR de las dos.
   ===================================================================== */

DECLARE @Trailer    VARCHAR(50) = 'R-QA-01';
DECLARE @Tolerancia INT = 200;   /* debe coincidir con TOLERANCIA_KG en src/calculos/pesos.js */

/* --- 1. Estado del trailer ------------------------------------------ */
WITH t AS (
  SELECT *,
         CASE
           WHEN Peso_Trailer_Entrada IS NOT NULL AND Peso_Trailer_Salida IS NOT NULL
             THEN CASE
                    WHEN ABS(Peso_Trailer_Entrada - Peso_Trailer_Salida) <= @Tolerancia
                      /* +1 antes de dividir para redondear hacia arriba igual
                         que Math.round en JS; la division entera de SQL Server
                         trunca y con una suma impar daria un kilo de menos. */
                      THEN (Peso_Trailer_Entrada + Peso_Trailer_Salida + 1) / 2
                    ELSE CASE WHEN Peso_Trailer_Entrada < Peso_Trailer_Salida
                              THEN Peso_Trailer_Entrada ELSE Peso_Trailer_Salida END
                  END
           ELSE COALESCE(Peso_Trailer_Entrada, Peso_Trailer_Salida)
         END AS Peso_Esperado
  FROM dbo.Trailers
  WHERE Trailer = @Trailer
)
SELECT  Trailer,
        Placa_Entrada, Peso_Entrada, taraCab1, Peso_Trailer_Entrada,
        Placa_Salida,  Peso_Salida,  taraCab2, Peso_Trailer_Salida,
        Peso_Trailer AS Peso_Guardado,
        Peso_Esperado,
        Diferencia_Determinaciones,
        CASE
          WHEN Peso_Trailer_Entrada IS NULL OR Peso_Trailer_Salida IS NULL THEN '-'
          WHEN ABS(Peso_Trailer_Entrada - Peso_Trailer_Salida) <= @Tolerancia THEN 'ninguno'
          WHEN Peso_Trailer_Entrada > Peso_Trailer_Salida THEN 'Entrada'
          ELSE 'Salida'
        END AS Extremo_Cargado,
        Culminado,
        CASE
          WHEN Peso_Trailer = Peso_Esperado THEN 'SI'
          WHEN Peso_Trailer IS NULL AND Peso_Esperado IS NULL THEN 'SI (sin determinar)'
          ELSE 'NO <<< REVISAR'
        END AS Coinciden
FROM    t
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
   VGM = Tara_Contenedor + Carga. Hay contenedor declarado cuando viene el
   numero O cuando el operario digito la tara: escribir la tara, que se lee
   del costado del contenedor, ya es declarar que hay uno.
   Carga en NULL es legitima: significa que el trailer todavia no estaba
   determinado y no se pudo separar la mercancia del equipo. */
SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor, Fecha_Entrada AS Proceso,
       Neto, Carga, Tara_Contenedor, Vgm,
       CASE
         WHEN LTRIM(RTRIM(ISNULL(No_Contenedor,''))) = '' AND ISNULL(Tara_Contenedor,0) = 0
           THEN CASE WHEN Vgm IS NULL THEN 'SI (sin contenedor, sin VGM)'
                     ELSE 'NO <<< no deberia declarar VGM' END
         WHEN Carga IS NULL
           THEN CASE WHEN Vgm IS NULL THEN 'SI (carga indeterminable)'
                     ELSE 'NO <<< VGM sin carga conocida' END
         WHEN Vgm = Tara_Contenedor + Carga THEN 'SI'
         ELSE 'NO <<< REVISAR'
       END AS Coinciden
FROM   dbo.Despachos
ORDER BY No_Tiquete DESC;

SELECT TOP (10)
       No_Tiquete, Placa, No_R, No_Contenedor, Fecha_Entrada AS Proceso,
       Neto, Carga, Tara_Contenedor, Vgm,
       CASE
         WHEN LTRIM(RTRIM(ISNULL(No_Contenedor,''))) = '' AND ISNULL(Tara_Contenedor,0) = 0
           THEN CASE WHEN Vgm IS NULL THEN 'SI (sin contenedor, sin VGM)'
                     ELSE 'NO <<< no deberia declarar VGM' END
         WHEN Carga IS NULL
           THEN CASE WHEN Vgm IS NULL THEN 'SI (carga indeterminable)'
                     ELSE 'NO <<< VGM sin carga conocida' END
         WHEN Vgm = Tara_Contenedor + Carga THEN 'SI'
         ELSE 'NO <<< REVISAR'
       END AS Coinciden
FROM   dbo.Ingresos
ORDER BY No_Tiquete DESC;

/* --- 5. El trailer se descuenta cuando viaja en un solo pesaje ------
   En Recoger_Trailer y Descargar_Trailer el Neto incluye el trailer. Si
   Carga sigue siendo igual al Neto, no se descontó. */
SELECT TOP (10)
       d.No_Tiquete, d.No_R, d.Fecha_Entrada AS Proceso,
       d.Neto, d.Carga,
       CASE WHEN d.Carga IS NULL THEN 'SI (trailer aun sin determinar)'
            WHEN d.Carga < d.Neto THEN 'SI'
            ELSE 'NO <<< no se descontó el trailer' END AS Coinciden
FROM   dbo.Despachos d
WHERE  d.Fecha_Entrada IN ('Recoger_Trailer', 'Descargar_Trailer')
ORDER BY d.No_Tiquete DESC;

/* --- 6. Seguimiento de la diferencia entre determinaciones ----------
   Correr tras unas semanas: es lo que permite fijar la tolerancia con
   cifras reales en vez de con el estimado de 200 kg.

   Los viajes por debajo de la tolerancia son los que se dieron por vacios
   en los dos extremos. Si aparecen muchos justo por debajo del limite,
   la tolerancia esta alta y se estan tragando cargas pequenas. */
SELECT  CASE WHEN Diferencia_Determinaciones <= @Tolerancia
             THEN 'Dentro de tolerancia (vacio)'
             ELSE 'Fuera de tolerancia (un extremo cargado)' END AS Grupo,
        COUNT(*)                        AS Viajes,
        MIN(Diferencia_Determinaciones) AS Diferencia_Minima,
        AVG(Diferencia_Determinaciones) AS Diferencia_Promedio,
        MAX(Diferencia_Determinaciones) AS Diferencia_Maxima
FROM    dbo.Trailers
WHERE   Diferencia_Determinaciones IS NOT NULL
GROUP BY CASE WHEN Diferencia_Determinaciones <= @Tolerancia
              THEN 'Dentro de tolerancia (vacio)'
              ELSE 'Fuera de tolerancia (un extremo cargado)' END;
