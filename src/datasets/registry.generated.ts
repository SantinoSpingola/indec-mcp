// ARCHIVO GENERADO por scripts/gen-from-openapi.ts — no editar a mano.
import type { DatasetDef } from "./types.js";

export const SPEC_META = {
  "titulo": "Catálogo API-INDEC",
  "version": "1.0.0",
  "openapi": "3.1.0",
  "sha256": "3ffbfb4efbddb7aa860878ca54a02c4beadb8d27bac1ee1aab5917a676c9d1f3"
} as const;

export const DATASETS: readonly DatasetDef[] = [
  {
    "id": "ipi_manufacturero",
    "area": "Dirección de Estadísticas Mineras, Manufactureras, Energéticas y de la Construcción",
    "titulo": "Índice de producción industrial manufacturero",
    "descripcion": "Índice de producción industrial manufacturero (IPI manufacturero), nivel general y aperturas por actividad económica, base 2004=100. Incluye las series original, desestacionalizada y tendencia-ciclo, expresadas como números índice y variaciones porcentuales.\n \nEste endpoint contiene información desde enero de 2016.\n \nPara más información, se puede consultar la metodología INDEC N° 31, Metodología del índice de producción industrial manufacturero, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_ipi_manufacturero_2019.pdf",
    "columnas": [
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM para meses"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "cuadro_web",
        "type": "string",
        "nullable": false,
        "description": "Número del cuadro estadístico publicado en el sitio web del INDEC al que corresponde el dato"
      },
      {
        "name": "codigo_CLaNAE_2004",
        "type": "string",
        "nullable": false,
        "description": "Código de Clasificación Nacional de Actividades Económicas 2004"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "serie",
        "type": "string",
        "nullable": false,
        "description": "Tipo de serie estadística: original, desestacionalizada o tendencia-ciclo"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o peso promedio"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas."
      }
    ],
    "claveOrden": [
      "periodo",
      "indicador",
      "cuadro_web",
      "codigo_CLaNAE_2004",
      "descripcion",
      "serie",
      "tipo_de_indicador"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "ipi_minero",
    "area": "Dirección de Estadísticas Mineras, Manufactureras, Energéticas y de la Construcción",
    "titulo": "Índice de producción industrial minero",
    "descripcion": "IPI minero nivel general. Series original, desestacionalizada y tendencia-ciclo, base 2016=100. Este endpoint contiene información desde enero de 2017. Para más información, se puede consultar la metodología INDEC N° 41, Índice de producción industrial minero, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_ipi_minero.pdf",
    "columnas": [
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM para meses"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "cuadro_web",
        "type": "string",
        "nullable": false,
        "description": "Número del cuadro estadístico publicado en el sitio web del INDEC al que corresponde el dato"
      },
      {
        "name": "codigo_ClaNAE_2010",
        "type": "string",
        "nullable": false,
        "description": "Código ClaNAE 2010"
      },
      {
        "name": "codigo_CPC_2_1",
        "type": "string",
        "nullable": false,
        "description": "Código CPC 2.1"
      },
      {
        "name": "serie",
        "type": "string",
        "nullable": false,
        "description": "Tipo de serie estadística: original, desestacionalizada o tendencia-ciclo"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      }
    ],
    "claveOrden": [
      "periodo",
      "anio",
      "mes",
      "indicador",
      "cuadro_web",
      "codigo_ClaNAE_2010",
      "codigo_CPC_2_1",
      "serie",
      "descripcion",
      "tipo_de_indicador",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "estimaciones_poblacion_departamento_2022_2035",
    "area": "Dirección de Estadísticas Poblacionales",
    "titulo": "Estimaciones de población por departamento y sexo",
    "descripcion": "Estimaciones de población al 1° de julio de cada año calendario, por sexo y departamento, con base en el Censo Nacional de Población, Hogares y Viviendas 2022. Años 2022-2035.   \n\nPara más información, se pueden consultar la siguiente documentación metodológica:  \nhttps://www.indec.gob.ar/ftp/cuadros/publicaciones/estimaciones_departamentos_2022_2035.pdf",
    "columnas": [
      {
        "name": "jurisdiccion_cod",
        "type": "string",
        "nullable": false,
        "description": "Código de dos posiciones que identifica a la jurisdicción de la República Argentina"
      },
      {
        "name": "jurisdiccion_nom",
        "type": "string",
        "nullable": false,
        "description": "Nombre de la jurisdicción de la República Argentina"
      },
      {
        "name": "departamento_cod",
        "type": "string",
        "nullable": false,
        "description": "Código de cinco posiciones que identifica al departamento, partido o comuna. Las dos primeras corresponden a la jurisdicción y las tres restantes al departamento, partido o comuna"
      },
      {
        "name": "departamento_nom",
        "type": "string",
        "nullable": false,
        "description": "Nombre del departamento, partido o comuna"
      },
      {
        "name": "rmba",
        "type": "string",
        "nullable": false,
        "description": "Indica si la jurisdicción, el departamento o el partido pertenece a la Región Metropolitana de Buenos Aires (RMBA)"
      },
      {
        "name": "sexo_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el sexo registrado al nacer"
      },
      {
        "name": "sexo_nom",
        "type": "string",
        "nullable": false,
        "description": "Categoría de sexo registrado al nacer"
      },
      {
        "name": "poblacion",
        "type": "number",
        "nullable": true,
        "description": "Cantidad de habitantes estimada (2022) o proyectada (2023-2040) para la fecha de referencia"
      },
      {
        "name": "fecha",
        "type": "string",
        "nullable": false,
        "description": "Año correspondiente a la estimación o proyección de población, referida al 1 de julio"
      }
    ],
    "claveOrden": [
      "departamento_cod",
      "sexo_cod",
      "fecha"
    ],
    "columnaPeriodo": "fecha",
    "columnaAnio": null,
    "frecuencia": "anual"
  },
  {
    "id": "proyecciones_poblacion_jurisdiccion_2022_2040",
    "area": "Dirección de Estadísticas Poblacionales",
    "titulo": "Proyecciones de población por jurisdicción, sexo y edad",
    "descripcion": "Estimaciones y proyecciones de población al 1° de julio de cada año calendario, por sexo y grupos de edad, con base en el Censo Nacional de Población, Hogares y Viviendas 2022. Jurisdicciones. Años 2022-2040.   \n\nPara más información, se pueden consultar la siguiente documentación metodológica: https://www.indec.gob.ar/ftp/cuadros/publicaciones/proyecciones_jurisdicciones_2022_2040.pdf",
    "columnas": [
      {
        "name": "jurisdiccion_cod",
        "type": "string",
        "nullable": false,
        "description": "Código de dos posiciones que identifica a la jurisdicción de la República Argentina"
      },
      {
        "name": "jurisdiccion_nom",
        "type": "string",
        "nullable": false,
        "description": "Nombre de la jurisdicción de la República Argentina"
      },
      {
        "name": "sexo_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el sexo registrado al nacer"
      },
      {
        "name": "sexo_nom",
        "type": "string",
        "nullable": false,
        "description": "Categoría de sexo registrado al nacer"
      },
      {
        "name": "edad_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica al grupo quinquenal de edad"
      },
      {
        "name": "edad_nom",
        "type": "string",
        "nullable": false,
        "description": "Intervalo de edad de cinco años correspondiente al código informado"
      },
      {
        "name": "poblacion",
        "type": "number",
        "nullable": true,
        "description": "Cantidad de habitantes estimada (2022) o proyectada (2023-2040) para la fecha de referencia"
      },
      {
        "name": "fecha",
        "type": "string",
        "nullable": false,
        "description": "Año correspondiente a la estimación o proyección de población, referida al 1 de julio"
      }
    ],
    "claveOrden": [
      "jurisdiccion_cod",
      "sexo_cod",
      "edad_cod",
      "fecha"
    ],
    "columnaPeriodo": "fecha",
    "columnaAnio": null,
    "frecuencia": "anual"
  },
  {
    "id": "proyecciones_poblacion_nacional_2022_2040",
    "area": "Dirección de Estadísticas Poblacionales",
    "titulo": "Proyecciones nacionales de población por sexo y edad",
    "descripcion": "Estimaciones y proyecciones de población al 1° de julio de cada año calendario, por sexo y edad, con base en el Censo Nacional de Población, Hogares y Viviendas 2022. Total del país. Años 2022-2040.   \n\nPara más información, se pueden consultar la siguiente documentación metodológica: https://www.indec.gob.ar/ftp/cuadros/publicaciones/proyecciones_nacionales_2022_2040.pdf",
    "columnas": [
      {
        "name": "edad",
        "type": "number",
        "nullable": false,
        "description": "Edad de las personas, expresada en años cumplidos"
      },
      {
        "name": "sexo_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica al sexo registrado al nacer"
      },
      {
        "name": "sexo_nom",
        "type": "string",
        "nullable": false,
        "description": "Categoría de sexo registrado al nacer"
      },
      {
        "name": "poblacion",
        "type": "number",
        "nullable": true,
        "description": "Cantidad de habitantes estimada (2022) o proyectada (2023-2040) para la fecha de referencia"
      },
      {
        "name": "fecha",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente a la estimación o proyección de población, referida al 1 de julio"
      }
    ],
    "claveOrden": [
      "edad",
      "sexo_cod",
      "fecha"
    ],
    "columnaPeriodo": "fecha",
    "columnaAnio": null,
    "frecuencia": "anual"
  },
  {
    "id": "ipc_nacional",
    "area": "Dirección de Índices de Precios de Consumo",
    "titulo": "Índice de Precios al Consumidor (IPC)",
    "descripcion": "Índice de precios al consumidor (IPC) de la República Argentina, con aperturas por región, división, grupo, clase y subclase, desde diciembre de 2016.\nPara más información, se puede consultar la metodología INDEC N° 32, Índice de precios al consumidor (IPC). Base diciembre 2016=100, a través del siguiente enlace:\nhttps://www.indec.gob.ar/ftp/cuadros/economia/metodologia_ipc_nacional_2019.pdf",
    "columnas": [
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "codigo",
        "type": "string",
        "nullable": false,
        "description": "Código asignado a la categoría de acuerdo con el clasificador utilizado"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "region",
        "type": "string",
        "nullable": false,
        "description": "Región estadística a la que corresponde el dato"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "clasificador",
      "nivel",
      "codigo",
      "descripcion",
      "periodo",
      "anio",
      "mes",
      "indicador",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "region",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "valorizacion_canastas_cba_cbt",
    "area": "Dirección de Índices de Precios de Consumo",
    "titulo": "Valorización de las canastas básicas (CBA y CBT)",
    "descripcion": "Valorización mensual de la canasta básica alimentaria (CBA) y de la canasta básica total (CBT) desde abril de 2016. Gran Buenos Aires.\nPara más información, se puede consultar la metodología INDEC N° 22, La medición de la pobreza y la indigencia en la Argentina, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/sociedad/EPH_metodologia_22_pobreza.pdf",
    "columnas": [
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "codigo",
        "type": "string",
        "nullable": false,
        "description": "Código asignado a la categoría de acuerdo con el clasificador utilizado"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "region",
        "type": "string",
        "nullable": false,
        "description": "Región estadística a la que corresponde el dato"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "clasificador",
      "nivel",
      "codigo",
      "descripcion",
      "periodo",
      "anio",
      "mes",
      "indicador",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "region",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "indice_salarios",
    "area": "Dirección de Índices de Precios de la Producción",
    "titulo": "Índice de salarios",
    "descripcion": "El índice de salarios estima la evolución de los salarios pagados en la economía aislando el indicador de variaciones relacionadas con conceptos tales como la cantidad de horas trabajadas, descuentos por ausentismo, premios por productividad y todo otro concepto asociado al desempeño o a las características de los individuos concretos.\n \nLa serie muestra la evolución de los salarios pagados en los sectores privado registrado y público desde noviembre de 2015. A partir de octubre de 2016 se incorporó la serie del sector privado no registrado y el cálculo del índice de salarios total, que resulta de la agregación de los índices de salarios de los componentes mencionados.\n \nPara más información, se puede consultar la metodología INDEC N° 16, Índice de salarios y coeficiente de variación salarial, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/sociedad/cvs_metodologia.pdf",
    "columnas": [
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "codigo",
        "type": "string",
        "nullable": false,
        "description": "Código asignado a la categoría de acuerdo con el clasificador utilizado"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "clasificador",
      "nivel",
      "codigo",
      "descripcion",
      "periodo",
      "anio",
      "mes",
      "indicador",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "icc_precios_construccion",
    "area": "Dirección de Índices de Precios de la Producción",
    "titulo": "Índice del costo de la construcción",
    "descripcion": "Índice del costo de la construcción (ICC) en el Gran Buenos Aires, base 1993. \nEste endpoint contiene información desde noviembre de 2015.\nPara más información, se puede consultar la metodología INDEC N°  9, Índice del Costo de la Construcción en el Gran Buenos Aires, base 1993, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_icc.pdf",
    "columnas": [
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "codigo_apertura",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el nivel de apertura o desagregación del dato"
      },
      {
        "name": "codigo_CPC_1",
        "type": "string",
        "nullable": false,
        "description": "Código de la Clasificación Central Provisional de Productos (CPC) elaborada por la Organización de las Naciones Unidas."
      },
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "region",
        "type": "string",
        "nullable": false,
        "description": "Región estadística a la que corresponde el dato"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "indicador",
      "codigo_apertura",
      "codigo_CPC_1",
      "clasificador",
      "nivel",
      "descripcion",
      "periodo",
      "anio",
      "mes",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "region",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "redeterminacion_precios_contratos_obras_publicas",
    "area": "Dirección de Índices de Precios de la Producción",
    "titulo": "Redeterminación de precios de obras públicas",
    "descripcion": "Aperturas del índice del costo de la construcción (ICC) y del índice de precios internos básicos al por mayor (IPIB) utilizadas para la redeterminación periódica de precios de contratos de obra pública, según el Decreto 1295/2002.\nTambién incluye indicadores requeridos por el Decreto 634/2003, relativo a las Ampliaciones de Transporte de Energía Eléctrica en Alta Tensión y por Distribución Troncal.\nEste endpoint contiene información desde diciembre de 2015.\nPara más información, se puede consultar la información disponible en el sitio web del INDEC :https://www.indec.gob.ar/indec/web/Nivel4-Tema-3-5-112",
    "columnas": [
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "operativo",
        "type": "string",
        "nullable": false,
        "description": "Operativo estadístico del que proviene el dato"
      },
      {
        "name": "inciso",
        "type": "string",
        "nullable": false,
        "description": "Código o denominación abreviada del inciso correspondiente al artículo 15 del Decreto 1295/2002"
      },
      {
        "name": "descripcion_inciso",
        "type": "string",
        "nullable": false,
        "description": "Denominación del inciso correspondiente al artículo 15 del Decreto 1295/2002"
      },
      {
        "name": "codigo_apertura",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el nivel de apertura o desagregación del dato"
      },
      {
        "name": "codigo_CPC_1",
        "type": "string",
        "nullable": true,
        "description": "Código de la Clasificación Central Provisional de Productos (CPC) elaborada por la Organización de las Naciones Unidas."
      },
      {
        "name": "codigo_CIUU_3",
        "type": "string",
        "nullable": true,
        "description": "Código de la Clasificación Industrial Internacional Uniforme (CIIU), revisión 3"
      },
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "origen",
        "type": "string",
        "nullable": false,
        "description": "Origen nacional o importado del producto de referencia"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "region",
        "type": "string",
        "nullable": false,
        "description": "Región estadística a la que corresponde el dato"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "indicador",
      "operativo",
      "inciso",
      "descripcion_inciso",
      "codigo_apertura",
      "clasificador",
      "nivel",
      "descripcion",
      "origen",
      "periodo",
      "anio",
      "mes",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "region",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "sipm_precios_mayoristas",
    "area": "Dirección de Índices de Precios de la Producción",
    "titulo": "Sistema de índices de precios mayoristas",
    "descripcion": "El Sistema de índices de precios mayoristas (SIPM) está compuesto por el índice de precios internos al por mayor (IPIM), el índice de precios internos básicos al por mayor (IPIB) y el índice de precios básicos del productor (IPP). Este endpoint contiene información desde diciembre de 2015.\nPara más información, se puede consultar la metodología INDEC N° 8, Sistema de Índices de Precios Mayoristas, base 1993, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia1_8_sipm.pdf",
    "columnas": [
      {
        "name": "operativo",
        "type": "string",
        "nullable": false,
        "description": "Operativo estadístico del que proviene el dato"
      },
      {
        "name": "indicador",
        "type": "string",
        "nullable": false,
        "description": "Nombre del indicador estadístico"
      },
      {
        "name": "clasificador",
        "type": "string",
        "nullable": false,
        "description": "Clasificador utilizado para organizar y codificar las categorías del dato"
      },
      {
        "name": "nivel",
        "type": "string",
        "nullable": false,
        "description": "Nivel de desagregación de la categoría dentro de la estructura del clasificador"
      },
      {
        "name": "codigo_apertura",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el nivel de apertura o desagregación del dato"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o precio promedio"
      },
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "region",
        "type": "string",
        "nullable": false,
        "description": "Región estadística a la que corresponde el dato"
      },
      {
        "name": "unidad_de_medida",
        "type": "string",
        "nullable": false,
        "description": "Unidad en la que se expresa el valor del indicador"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "operativo",
      "indicador",
      "clasificador",
      "nivel",
      "codigo_apertura",
      "descripcion",
      "periodo",
      "anio",
      "mes",
      "tipo_de_indicador",
      "tipo_de_indicador_descripcion",
      "region",
      "unidad_de_medida"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "estimador-mensual-de-actividad-economica-nivel-general",
    "area": "Dirección Nacional de Cuentas Nacionales",
    "titulo": "Estimador mensual de actividad económica. Nivel general",
    "descripcion": "Estimador mensual de actividad económica (EMAE), nivel general, base 2004=100. Incluye la serie original, desestacionalizada y tendencia-ciclo, expresadas como números índice y variaciones porcentuales.\n\nEste endpoint contiene información desde enero de 2004.\n\nPara más información, se puede consultar la metodología INDEC N° 20, Estimador Mensual de Actividad Económica (EMAE), Base año 2004, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_emae_ago_16.pdf",
    "columnas": [
      {
        "name": "tipo_de_indicador_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Descripción del tipo de indicador"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o peso promedio"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "tipo_de_indicador_descripcion",
      "anio",
      "mes",
      "periodo",
      "tipo_de_indicador"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "estimador-mensual-de-actividad-economica-sectores",
    "area": "Dirección Nacional de Cuentas Nacionales",
    "titulo": "Estimador mensual de actividad económica. Sectores",
    "descripcion": "Estimador mensual de actividad económica (EMAE) por sector de actividad económica, base 2004=100 (serie original). Incluye números índice y variaciones porcentuales interanuales para cada sector desde enero de 2004.\n\nPara más información, se puede consultar la metodología INDEC N° 20, Estimador Mensual de Actividad Económica (EMAE), Base año 2004, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_emae_ago_16.pdf",
    "columnas": [
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "codigo",
        "type": "string",
        "nullable": false,
        "description": "Código letra de la Clasificación nacional de actividades económicas 2004 (ClaNAE04)"
      },
      {
        "name": "descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación de la categoría correspondiente al código informado"
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "tipo_de_indicador",
        "type": "string",
        "nullable": false,
        "description": "Tipo de cálculo o presentación del indicador, como índice, variación intermensual, variación interanual, variación acumulada, incidencia o peso promedio"
      },
      {
        "name": "valor",
        "type": "number",
        "nullable": true,
        "description": "Valor del indicador para el período y las categorías informadas"
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas necesarias para el valor informado"
      }
    ],
    "claveOrden": [
      "anio",
      "mes",
      "codigo",
      "descripcion",
      "periodo",
      "tipo_de_indicador"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "pobreza_eph",
    "area": "Dirección Nacional de Estadísticas de Condiciones de Vida",
    "titulo": "Incidencia de la pobreza y la indigencia (EPH)",
    "descripcion": "Incidencia de la pobreza y la indigencia en hogares y personas a partir de la Encuesta Permanente de Hogares (EPH) para el total de 31 aglomerados urbanos. La información se presenta con frecuencia semestral desde el segundo semestre de 2016.\n\nPara más información, se puede consultar la metodología INDEC N° 22, la medición de la pobreza y la indigencia en la Argentina, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/sociedad/metodologia_eph_continua.pdf . Y se puede acceder a los informes técnicos y datos complementarios en: https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-31-58",
    "columnas": [
      {
        "name": "area_geografica_nom",
        "type": "string",
        "nullable": false,
        "description": "Denominación del área geográfica a la que corresponde el dato."
      },
      {
        "name": "area_geografica_cod",
        "type": "number",
        "nullable": true,
        "description": "Código que identifica el área geográfica a la que corresponde el dato. Ver diseño de registros y estructura para las bases preliminares (hogares y personas) de EPH en https://www.indec.gob.ar/indec/web/Institucional-Indec-BasesDeDatos ."
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAANS (número de semestre)"
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato."
      },
      {
        "name": "semestre",
        "type": "number",
        "nullable": false,
        "description": "Número del semestre correspondiente al año de referencia. Utiliza los valores 1 (primer semestre) y 2 (segundo semestre)."
      },
      {
        "name": "tasa_pobreza_hogares",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de hogares cuyos ingresos se encuentran por debajo de su respectiva línea de pobreza en relación con el total de hogares."
      },
      {
        "name": "tasa_pobreza_personas",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de personas que habitan en hogares cuyos ingresos se encuentran por debajo de su respectiva línea de pobreza en relación con el total de personas."
      },
      {
        "name": "tasa_indigencia_hogares",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de hogares cuyos ingresos se encuentran por debajo de su respectiva línea de indigencia en relación con el total de hogares."
      },
      {
        "name": "tasa_indigencia_personas",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de personas que habitan en hogares cuyos ingresos se encuentran por debajo de su respectiva línea de indigencia en relación con el total de personas."
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas vinculadas a los valores informados."
      }
    ],
    "claveOrden": [
      "area_geografica_nom",
      "periodo"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "semestral"
  },
  {
    "id": "mercado_trabajo_eph",
    "area": "Dirección Nacional de Estadísticas de Condiciones de Vida",
    "titulo": "Principales tasas del mercado de trabajo (EPH)",
    "descripcion": "Principales tasas del mercado de trabajo estimadas a partir de la Encuesta Permanente de Hogares (EPH), correspondientes al total de 31 aglomerados urbanos. Incluye las tasas de actividad, empleo, empleo formal e informal, desocupación, ocupación demandante de empleo y subocupación. La información se presenta con frecuencia trimestral desde el segundo trimestre de 2016.\nPara más información, se puede consultar la metodología INDEC de la EPH a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/sociedad/metodologia_eph_continua.pdf\nY acceder a informes técnicos y datos complementarios en: https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-31-58",
    "columnas": [
      {
        "name": "area_geografica_nom",
        "type": "string",
        "nullable": false,
        "description": "Denominación del área geográfica a la que corresponde el dato."
      },
      {
        "name": "area_geografica_cod",
        "type": "number",
        "nullable": true,
        "description": "Código que identifica el área geográfica a la que corresponde el dato. Ver diseño de registros y estructura para las bases preliminares (hogares y personas) de EPH en https://www.indec.gob.ar/indec/web/Institucional-Indec-BasesDeDatos ."
      },
      {
        "name": "periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAANT (número de trimestre que utiliza valores comprendidos entre 1 Y 4)."
      },
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato."
      },
      {
        "name": "trimestre",
        "type": "number",
        "nullable": false,
        "description": "Número del trimestre correspondiente al año de referencia. Utiliza valores comprendidos entre 1 (primer trimestre) y 4 (cuarto trimestre)."
      },
      {
        "name": "tasa_de_actividad",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población económicamente activa con respecto a la población total de referencia."
      },
      {
        "name": "tasa_de_empleo",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población ocupada con respecto a la población total de referencia."
      },
      {
        "name": "tasa_de_empleo_formal",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población ocupada con empleo formal con respecto a la población total de referencia."
      },
      {
        "name": "tasa_de_empleo_informal",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población ocupada con empleo informal con respecto a la población total de referencia."
      },
      {
        "name": "tasa_de_desocupacion",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población desocupada con respecto a la población económicamente activa."
      },
      {
        "name": "tasa_de_ocupacion_demandante",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población ocupada que busca activamente otra ocupación con respecto a la población económicamente activa."
      },
      {
        "name": "tasa_de_subocupacion",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población subocupada con respecto a la población económicamente activa."
      },
      {
        "name": "tasa_de_subocupacion_demandante",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población subocupada que busca activamente otra ocupación con respecto a la población económicamente activa."
      },
      {
        "name": "tasa_de_subocupacion_no_demandante",
        "type": "number",
        "nullable": true,
        "description": "Porcentaje de la población subocupada que busca activamente otra ocupación con respecto a la población económicamente activa."
      },
      {
        "name": "observaciones",
        "type": "string",
        "nullable": true,
        "description": "Notas vinculadas a los valores informados."
      }
    ],
    "claveOrden": [
      "area_geografica_nom",
      "periodo"
    ],
    "columnaPeriodo": "periodo",
    "columnaAnio": "anio",
    "frecuencia": "trimestral"
  },
  {
    "id": "canasta-crianza",
    "area": "Dirección Nacional de Estadísticas de Condiciones de Vida",
    "titulo": "Valorización de la canasta de crianza",
    "descripcion": "Valorización mensual de la canasta de crianza de la primera infancia, la niñez y la adolescencia. Está conformada por el costo de los bienes y servicios, y la valorización del tiempo de cuidado. La estimación se realiza para cuatro tramos de edad: menores de 1 año, de 1 a 3 años, de 4 a 5 años y de 6 a 12 años. \n\nGran Buenos Aires.\n\nEste endpoint contiene información desde enero de 2020. \n\nPara más información sobre la canasta de crianza, se puede consultar el siguiente enlace: https://www.indec.gob.ar/indec/web/Nivel4-Tema-4-43-173",
    "columnas": [
      {
        "name": "anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "Mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "Periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "bys_men1",
        "type": "number",
        "nullable": true,
        "description": "Costo mensual de los bienes y servicios incluidos en la canasta de crianza para menores de 1 año, expresado en pesos argentinos"
      },
      {
        "name": "cuid_men1",
        "type": "number",
        "nullable": true,
        "description": "Valorización mensual del tiempo de cuidado requerido para menores de 1 año, expresado en pesos argentinos"
      },
      {
        "name": "tot_men1",
        "type": "number",
        "nullable": true,
        "description": "Valor mensual total de la canasta de crianza para menores de 1 año, expresado en pesos argentinos"
      },
      {
        "name": "bys_1a3",
        "type": "number",
        "nullable": true,
        "description": "Costo mensual de los bienes y servicios incluidos en la canasta de crianza para niñas y niños de 1 a 3 años, expresado en pesos argentinos"
      },
      {
        "name": "cuid_1a3",
        "type": "number",
        "nullable": true,
        "description": "Valorización mensual del tiempo de cuidado requerido para niñas y niños de 1 a 3 años, expresado en pesos argentinos"
      },
      {
        "name": "tot_1a3",
        "type": "number",
        "nullable": true,
        "description": "Valor mensual total de la canasta de crianza para niñas y niños de 1 a 3 años, expresado en pesos argentinos"
      },
      {
        "name": "bys_4a5",
        "type": "number",
        "nullable": true,
        "description": "Costo mensual de los bienes y servicios incluidos en la canasta de crianza para niñas y niños de 4 a 5 años, expresado en pesos argentinos"
      },
      {
        "name": "cuid_4a5",
        "type": "number",
        "nullable": true,
        "description": "Valorización mensual del tiempo de cuidado requerido para niñas y niños de 4 a 5 años, expresado en pesos argentinos"
      },
      {
        "name": "tot_4a5",
        "type": "number",
        "nullable": true,
        "description": "Valor mensual total de la canasta de crianza para niñas y niños de 4 a 5 años, expresado en pesos argentinos"
      },
      {
        "name": "bys_6a12",
        "type": "number",
        "nullable": true,
        "description": "Costo mensual de los bienes y servicios incluidos en la canasta de crianza para niñas, niños y adolescentes de 6 a 12 años, expresado en pesos argentinos"
      },
      {
        "name": "cuid_6a12",
        "type": "number",
        "nullable": true,
        "description": "Valorización mensual del tiempo de cuidado requerido para niñas, niños y adolescentes de 6 a 12 años, expresado en pesos argentinos"
      },
      {
        "name": "tot_6a12",
        "type": "number",
        "nullable": true,
        "description": "Valor mensual total de la canasta de crianza para niñas, niños y adolescentes de 6 a 12 años, expresado en pesos argentinos"
      }
    ],
    "claveOrden": [
      "Periodo"
    ],
    "columnaPeriodo": "Periodo",
    "columnaAnio": "anio",
    "frecuencia": "mensual"
  },
  {
    "id": "comercio_exterior_nomenclaturas",
    "area": "Dirección Nacional de Estadísticas del Sector Externo y Cuentas Internacionales",
    "titulo": "Códigos y denominaciones de comercio exterior",
    "descripcion": "Diccionario de códigos y nomenclaturas utilizados en los servicios de datos de comercio exterior de la Dirección Nacional de Estadísticas del Sector Externo y Cuentas Internacionales.\nIncluye los códigos de país, grandes rubros y subrubros de las exportaciones, y los usos económicos y grandes categorías económicas de las importaciones.",
    "columnas": [
      {
        "name": "nombre_columna",
        "type": "string",
        "nullable": false,
        "description": "Nombre de la columna de los servicios de datos de comercio exterior en la que se utiliza el código"
      },
      {
        "name": "codigo",
        "type": "string",
        "nullable": false,
        "description": "Código utilizado en la columna indicada de los servicios de datos de comercio exterior"
      },
      {
        "name": "codigo_descripcion",
        "type": "string",
        "nullable": false,
        "description": "Denominación correspondiente al código informado"
      }
    ],
    "claveOrden": [
      "nombre_columna",
      "codigo"
    ],
    "columnaPeriodo": null,
    "columnaAnio": null,
    "frecuencia": "sin_periodo"
  },
  {
    "id": "comercio_exterior_exportacion_bienes",
    "area": "Dirección Nacional de Estadísticas del Sector Externo y Cuentas Internacionales",
    "titulo": "Exportaciones de bienes por rubros y países de destino",
    "descripcion": "Exportaciones argentinas de bienes por grandes rubros, subrubros y país de destino desde enero de 1986. Incluye el valor FOB expresado en dólares estadounidenses y el peso neto de las mercaderías expresado en kilogramos. \nLa información se presenta con frecuencia mensual. Se aplican criterios de supresión para resguardar el secreto estadístico y la confidencialidad de la información aduanera. El signo convencional “s” indica que se registraron operaciones, pero el número de operadores fue insuficiente para publicar el valor.\n\nPara conocer los códigos de país, rubro y subrubro, se encuentra disponible el servicio de datos llamado “Códigos y nomencladores de comercio exterior” (https://api.indec.gob.ar/v1/comercio_exterior_nomenclaturas).\n\nPara más información, se puede consultar la metodología INDEC N° 26, Metodología de comercio exterior, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_comex.pdf",
    "columnas": [
      {
        "name": "Anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "Mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "Periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "rubro_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el rubro al que pertenece la exportación"
      },
      {
        "name": "subrubro_cod",
        "type": "string",
        "nullable": false,
        "description": "Código de tres posiciones que identifica el subrubro de exportación dentro del rubro correspondiente"
      },
      {
        "name": "pais_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el país de origen de las importaciones o de destino de las exportaciones"
      },
      {
        "name": "valor_FOB",
        "type": "number",
        "nullable": true,
        "description": "Valor de las exportaciones a precios FOB, expresado en dólares estadounidenses"
      },
      {
        "name": "Peso_Neto",
        "type": "number",
        "nullable": true,
        "description": "Peso neto de los bienes que componen el rubro o subrubro informado, expresado en kilogramos"
      }
    ],
    "claveOrden": [
      "Anio",
      "Mes",
      "Periodo",
      "rubro_cod",
      "subrubro_cod",
      "pais_cod"
    ],
    "columnaPeriodo": "Periodo",
    "columnaAnio": "Anio",
    "frecuencia": "mensual"
  },
  {
    "id": "comercio_exterior_importacion_bienes",
    "area": "Dirección Nacional de Estadísticas del Sector Externo y Cuentas Internacionales",
    "titulo": "Importaciones de bienes por uso económico y país de origen",
    "descripcion": "Importaciones argentinas de bienes por uso económico, grandes categorías económica y país de origen. Incluye el valor CIF expresado en dólares estadounidenses y el peso neto de las mercaderías expresado en kilogramos. La información se presenta con frecuencia mensual. \n\nEste endpoint contiene información desde enero de 1986. \n\nPara conocer los códigos de país, uso económico y gran categoría económica, se encuentra disponible el servicio de datos llamado “Códigos y nomencladores de comercio exterior” (https://api.indec.gob.ar/v1/comercio_exterior_nomenclaturas).\n\nPara más información, se puede consultar la metodología INDEC N° 26, Metodología de comercio exterior, a través del siguiente enlace: https://www.indec.gob.ar/ftp/cuadros/economia/metodologia_comex.pdf",
    "columnas": [
      {
        "name": "Anio",
        "type": "number",
        "nullable": false,
        "description": "Año correspondiente al período de referencia del dato"
      },
      {
        "name": "Mes",
        "type": "number",
        "nullable": false,
        "description": "Número del mes correspondiente al período de referencia. Utiliza valores comprendidos entre 1 (enero) y 12 (diciembre)"
      },
      {
        "name": "Periodo",
        "type": "string",
        "nullable": false,
        "description": "Período de referencia del dato, expresado en formato AAAAMM (meses)"
      },
      {
        "name": "uso_economico_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el uso económico de las importaciones"
      },
      {
        "name": "gce_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica la gran categoría económica dentro del uso económico de importación correspondiente"
      },
      {
        "name": "pais_cod",
        "type": "string",
        "nullable": false,
        "description": "Código que identifica el país de origen de las importaciones o de destino de las exportaciones"
      },
      {
        "name": "valor_CIF",
        "type": "number",
        "nullable": true,
        "description": "Valor de las importaciones a precios CIF, expresado en dólares estadounidenses"
      },
      {
        "name": "peso_neto",
        "type": "number",
        "nullable": true,
        "description": "Peso neto de los bienes que componen el uso económico o categoría económica informada, expresado en kilogramos"
      }
    ],
    "claveOrden": [
      "Anio",
      "Mes",
      "Periodo",
      "uso_economico_cod",
      "gce_cod",
      "pais_cod"
    ],
    "columnaPeriodo": "Periodo",
    "columnaAnio": "Anio",
    "frecuencia": "mensual"
  }
];
