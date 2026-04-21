import { error } from "console";
import { pattern } from "framer-motion/client";

export type SelectOption = {
  label: string;
  description?: string;
};

export type SelectQuestionConfig = {
  options: SelectOption[];
  multiple: boolean; // true para checkboxes, false para radio buttons
  maxSelections?: number;
};

export type FormConfig = {
  questions: string[];
  placeholders: string[];
  storageKey: string;
  indices: {
    budgetQuestionIndex: number;
    servicesQuestionIndex: number;
    countryQuestionIndex: number;
  };
  // Configuración de preguntas select: índice de pregunta -> configuración
  selectQuestions?: Record<number, SelectQuestionConfig>;
  validationRules?: Record<number, ValidationRules>; // índice de pregunta -> reglas de validación
};

export type ValidationRules = {
  pattern: RegExp;
  errorMessage: string;
  minLength?: number;
  maxLength?: number;
  blockedWords?: string[]; // Palabras no permitidas (se validan en minúsculas)
};


const MAIN_QUESTIONS = [
  "1. Nombre y apellido",
  "2. Cargo y responsabilidades",
  "3. Institución / Empresa",
  "4. Tipo de institución (Banco, Cooperativa, Fintech, Empresa)",
  "5. País(es) donde opera",
  "6. Actividad principal de la institución",
  "7. Productos o servicios financieros actuales",
  "8. Segmento de clientes atendido",
  "9. Número aproximado de clientes activos",
  "10. Nivel de digitalización actual (bajo / medio / alto)",
  "11. Problema principal que desean resolver",
  "12. Objetivo de negocio a 6/12 meses",
  "13. Consecuencia de no ejecutar este proyecto",
  "14. Funcionalidades requeridas para el MVP",
  "15. Funcionalidades previstas para fases futuras",
  "16. Fecha objetivo de salida a producción",
  "17. Core bancario o sistema transaccional actual",
  "18. ¿El core expone APIs REST?",
  "19. ¿Existen ambientes de sandbox y producción?",
  "20. Proveedores tecnológicos críticos actuales",
  "21. Canales digitales activos (app, web, POS, otros)",
  "22. ¿Utilizan webhooks o eventos en tiempo real?",
  "23. Integraciones externas críticas (core, pagos, identidad, regulador)",
  "24. Método actual de autenticación de usuarios",
  "25. ¿Utilizan tokens de sesión (JWT u otro)?",
  "26. ¿Implementan doble factor de autenticación (2FA)?",
  "27. ¿Recolectan información de dispositivo y geolocalización?",
  "28. ¿Permiten onboarding 100% digital?",
  "29. Proceso actual de validación de identidad",
  "30. ¿Ejecutan validación AML/listas negras en el flujo?",
  "31. Periodicidad del control AML (registro / continuo)",
  "32. ¿Manejan wallet o saldo digital?",
  "33. Tipos de transferencias soportadas (P2P, interbancarias, SPI)",
  "34. ¿El core maneja saldo disponible vs saldo contable?",
  "35. ¿Las transacciones se procesan en tiempo real?",
  "36. ¿Emiten tarjetas (débito / crédito / prepago)?",
  "37. Regulador principal",
  "38. ¿Requieren contrato digital y T&C?",
  "39. Usuarios estimados primer año",
  "40. Transacciones mensuales estimadas",
  "41. ¿Cuentan con presupuesto asignado?",
  "42. Responsable interno del proyecto",
  "43. ¿Quién te refirió con nosotros?",
  "44. ¿Qué servicios te interesarían?",
];

const MAIN_PLACEHOLDERS = [
  "Ej: Ana García",
  "Ej: Directora de Innovación, lidera proyectos digitales",
  "Ej: Banco Andino",
  "Ej: Fintech",
  "Ej: Ecuador y Perú",
  "Ej: Banca minorista y créditos de consumo",
  "Ej: Cuentas corrientes, tarjetas de débito, microcréditos",
  "Ej: PYMES y profesionales independientes",
  "Ej: 150000 clientes activos",
  "Ej: Digitalización media, procesos híbridos",
  "Ej: Reducir tiempos de onboarding de clientes",
  "Ej: Lanzar nueva app de onboarding digital",
  "Ej: Continuarán las fugas de clientes y costos altos",
  "Ej: Registro digital, validación de identidad y firma de contratos",
  "Ej: Integrar préstamos digitales y scoring avanzado",
  "Ej: Q4 2025",
  "Ej: Temenos T24 conectado a middleware propio",
  "Ej: Sí, contamos con APIs REST documentadas",
  "Ej: Sí, tenemos sandbox para pruebas y ambiente productivo",
  "Ej: AWS, Fiserv, proveedores locales de pagos",
  "Ej: Banca web, app móvil y POS propios",
  "Ej: Sí, usamos webhooks para eventos transaccionales e inicioes de sesión",
  "Ej: Core bancario, pasarela de pagos y proveedor de identidad",
  "Ej: Login con usuario/contraseña reforzado con OTP",
  "Ej: Sí, tokens JWT emitidos por nuestro IdP",
  "Ej: Sí, enviamos OTP por SMS para 2FA",
  "Ej: Capturamos huella del dispositivo y ubicación aproximada",
  "Ej: Sí, el onboarding es 100% digital",
  "Ej: Validación biométrica y consulta de listas oficiales",
  "Ej: Revisamos listas AML en cada alta",
  "Ej: Control continuo con monitoreo mensual",
  "Ej: Sí, ofrecemos wallet con saldos en USD",
  "Ej: P2P, interbancarias ACH y SPI",
  "Ej: Sí, el core separa saldo disponible y contable",
  "Ej: Sí, conciliamos en tiempo real",
  "Ej: Emitimos tarjetas de débito y prepago",
  "Ej: Superintendencia de Bancos de Ecuador",
  "Ej: Sí, requerimos contrato digital y T&C firmados",
  "Ej: 50000 usuarios durante el primer año",
  "Ej: 200000 transacciones mensuales estimadas",
  "Ej: Sí, tenemos presupuesto aprobado",
  "Ej: María Gómez, líder de Transformación Digital",
  "Ej: Referido por Pedro Pérez (Zelify)",
  "Ej: Servicios de identidad, AML, tarjetas...",
];

const TECH_QUESTIONS = [
  "1. Nombre completo del responsable del proyecto dentro de la organización.",
  "2. ¿Cuál es su cargo actual y qué responsabilidades tiene en relación con los productos financieros y/o la operación tecnológica (por ejemplo: banca digital, SPEI, cumplimiento, riesgos, etc.)?",
  "3. ¿Cuáles de los siguientes productos o servicios financieros ofrece actualmente la organización? (Seleccione todos los que apliquen)",
  "4. ¿Qué funcionalidades considera críticas para el MVP del core bancario? (Seleccione máximo 5)",
  "5. ¿Cuál es el nivel de experiencia en integraciones mediante APIs o servicios con terceros?",
  "6. ¿Qué tipo de proveedores tecnológicos utiliza actualmente? (Seleccione todos los que apliquen)",
  "7. ¿La arquitectura actual utiliza eventos en tiempo real (webhooks, colas)?",
  "8. ¿Cómo gestionan la autenticación y sesiones de usuario?",
  "9. ¿Se utiliza autenticación de doble factor (2FA)?",
  "10. ¿Se recolecta información de dispositivo o geolocalización para control de riesgo?",
  "11. ¿Cómo se gestionan los procesos de validación de identidad (KYC) y listas AML?",
  "12. ¿La organización cuenta con billetera digital o planea implementarla?",
  "13. ¿Qué tipos de transferencias maneja o planea manejar?",
  "14. ¿Qué nivel de definición tienen los productos y reglas de negocio?",
  "15. ¿Qué nivel de claridad existe sobre los sistemas a integrar?",
  "16. ¿Qué tan definida está la arquitectura de integración?",
  "17. ¿Cuál es la madurez en el uso de API Gateway o middleware?",
  "18. ¿Qué nivel de madurez tiene la seguridad a nivel arquitectura (autenticación, autorización)?",
  "19. ¿Qué tan definida está la infraestructura objetivo (cloud, HA, ambientes)?",
  "20. ¿Qué nivel de definición tienen las integraciones con terceros críticos (pagos, buró, KYC)?",
];

const TECH_PLACEHOLDERS = [
  "Ej: Xavier García",
  "Ej: Director de Tecnología; lidero banca digital, integraciones, riesgos operativos y cumplimiento técnico.",
  "Selecciona una o varias opciones",
  "Selecciona hasta 5 opciones",
  "Selecciona una opcion",
  "Selecciona una o varias opciones",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una o varias opciones",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
  "Selecciona una opcion",
];

const COMERCIAL_QUESTIONS = [
  // Sección 1 — Contacto
  "1. Nombre y apellido",
  "2. Cargo y responsabilidades",
  "3. Institución / Empresa",

  // Sección 2 — Contexto institucional
  "4. Tipo de institución",
  "5. País(es) donde opera",
  "6. Actividad principal de la institución",
  "7. Problema principal que desean resolver en la digitalización tecnológica de su institución financiera",
  "8. Productos o servicios financieros actuales",
  "9. Segmento de clientes atendido",

  // Sección 3 — Estrategia y canales
  "10. Objetivo de negocio a 6/12 meses",
  "11. Canales digitales activos (app, web, POS, otros)",

  // Sección 4 — Core y arquitectura
  "12. ¿Tiene core bancario? Si la respuesta es sí, ¿Cuál es el core bancario actual y qué módulos tiene?",
  "13. ¿Qué servicios necesitarían para su core bancario? (Seleccione todos los que apliquen)",
  "14. Número de usuarios del sistema (empleados, ejecutivos, operacionales)",
  "15. ¿Qué módulos requerirían para su solución? (Seleccione todos los que apliquen)",
  "16. Monedas soportadas (locales y extranjeras)",
  "17. ¿Qué canales requerirían? (Seleccione todos los que apliquen)",
  "18. Timeline de implementación deseado",
  "19. Infraestructura preferida",
  "20. Requisitos de cumplimiento necesarios (Seleccione todos los que apliquen)",

  // Sección 6 — Integraciones
  "21. Integraciones externas críticas (core, pagos, validación de identidad, cumplimiento)",

  // Sección 7 — Pagos y tarjetas
  "22. Tipos de transferencias interbancarias",
  "23. ¿Emiten tarjetas (débito, crédito o prepago)?",

  // Sección 8 — Métricas operativas
  "24. TPV (Monto total transaccionado): ¿Cuál es el valor total de dinero que estimas que se moverá en todo 2026?",
  "25. TPN (Total de transacciones procesadas): ¿Cuántas transacciones en total estimas procesar en todo 2026?",
  "26. TA (Número total de tarjetas activas): ¿Cuántas tarjetas activas estimas tener al 31 de diciembre de 2026?",
  "27. Número de depósitos al mes por cliente",
  "28. Retiros mensuales por cliente: En promedio, ¿cuántos retiros hará cada cliente al mes en 2026?",
  "29. Gasto mensual estimado por usuario: En promedio, ¿cuánto dinero estimas que cada usuario gastará al mes en 2026?",
  "30. Ingresos mensuales estimados por usuario: En promedio, ¿cuánto dinero ingresará cada usuario al mes en 2026?",

  // Sección 9 — Proyección
  "31. Usuarios estimados (año 1 y año 2): ¿Cuántos usuarios activos estimas tener al cierre del Año 1 y al cierre del Año 2 desde tu lanzamiento?",
  "32. Número de transferencias interbancarias mensuales estimadas",

  // Sección 10 — Presupuesto y referencia
  "33. Presupuesto asignado para digitalización",
  "34. ¿Quién te refirió con nosotros?"
];


const COMERCIAL_PLACEHOLDERS = [
  // Sección 1 — Contacto
  "Ej: Ana García",
  "Ej: Head de Canales Digitales / CTO / Gerente de Innovación",
  "Ej: Banco Andino / Cooperativa XYZ / Fintech ABC",

  // Sección 2 — Contexto institucional
  "Ej: Banco / Cooperativa / Fintech / Empresa",
  "Ej: Ecuador, Colombia, México",
  "Ej: Ahorro y crédito, pagos, banca digital",
  "Ej: Reducir tiempos y fricción en el onboarding de clientes",
  "Ej: Cuentas de ahorro, tarjetas, transferencias, créditos",
  "Ej: Retail, PYMEs, corporativo, no bancarizados",

  // Sección 3 — Estrategia y canales
  "Ej: Lanzar un neobanco, digitalizar procesos, escalar usuarios",
  "Ej: App móvil, web, POS",

  // Sección 4 — Core y arquitectura
  "Ej: Sí, usamos  módulos de cuentas y pagos en transacciones nacionales e internacionles / No contamos con core",
  "Selecciona una o varias opciones",
  "Ej: 120 empleados, 25 ejecutivos, 40 usuarios operacionales",
  "Selecciona una o varias opciones",
  "Ej: USD, MXN, EUR",
  "Selecciona una o varias opciones",
  "Selecciona una opción",
  "Selecciona una opción",
  "Selecciona una o varias opciones",

  // Sección 6 — Integraciones
  "Ej: Core bancario, procesador de pagos, KYC, AML",

  // Sección 7 — Pagos y tarjetas
  "Ej: ACH, SPEI, transferencias inmediatas",
  "Ej: Sí, tarjetas débito",

  // Sección 8 — Métricas operativas
  "Ej: 21.000.000 USD en 2026",
  "Ej: 500.000 transacciones en 2026",
  "Ej: 20.000 tarjetas activas al cierre de 2026",
  "Ej: 8 depósitos mensuales por cliente",
  "Ej: 2 retiros por cliente/mes",
  "Ej: USD 200 por usuario/mes",
  "Ej: USD 500 mensuales",

  // Sección 9 — Proyección
  "Ej: Año 1: 50.000 / Año 2: 150.000 usuarios activos",
  "Ej: 60,000 transferencias mensuales",

  // Sección 10 — Presupuesto y referencia
  "Ej: De 10,000 a 50,000 USD",
  "Ej: Referido por partner, evento o contacto directo"
];


export const MAIN_FORM: FormConfig = {
  questions: MAIN_QUESTIONS,
  placeholders: MAIN_PLACEHOLDERS,
  storageKey: "form-onboarding-answers",
  indices: {
    budgetQuestionIndex: 40,
    servicesQuestionIndex: 43,
    countryQuestionIndex: 4,
  },
};

export const TECNOLOGICO_FORM: FormConfig = {
  questions: TECH_QUESTIONS,
  placeholders: TECH_PLACEHOLDERS,
  storageKey: "form-onboarding-tecnologico-answers",
  indices: {
    budgetQuestionIndex: -1, // El formulario técnico NO tiene pregunta de presupuesto
    servicesQuestionIndex: -1, // El formulario técnico usa preguntas select configurables
    countryQuestionIndex: -1, // El formulario técnico NO tiene pregunta de países
  },
  selectQuestions: {
    2: {
      multiple: true,
      options: [
        { label: "a) Productos de crédito (consumo, nómina, PyME)" },
        { label: "b) Cuentas de depósito (ahorro o vista con CLABE)" },
        { label: "c) Billetera digital (wallet) o cuentas electrónicas" },
        { label: "d) Tarjetas (crédito o débito)" },
        { label: "e) Transferencias electrónicas (SPEI o internas)" },
      ],
    },
    3: {
      multiple: true,
      maxSelections: 5,
      options: [
        { label: "a) Onboarding digital (KYC)" },
        { label: "b) Gestión de productos (créditos/cuentas)" },
        { label: "c) Transferencias y pagos (SPEI)" },
        { label: "d) Integración con terceros (buró, KYC, pagos)" },
        { label: "e) Seguridad y autenticación" },
      ],
    },
    4: {
      multiple: false,
      options: [
        { label: "a) Alta (APIs productivas)" },
        { label: "b) Media" },
        { label: "c) Baja" },
        { label: "d) Nula" },
        { label: "e) No aplica" },
      ],
    },
    5: {
      multiple: true,
      options: [
        { label: "a) Cloud (AWS, Azure, GCP)" },
        { label: "b) Pagos / SPEI" },
        { label: "c) KYC / identidad" },
        { label: "d) Buró de crédito" },
        { label: "e) Desarrollo interno" },
      ],
    },
    6: {
      multiple: false,
      options: [
        { label: "a) Sí, en producción" },
        { label: "b) Parcial" },
        { label: "c) Definido" },
        { label: "d) No" },
        { label: "e) No seguro" },
      ],
    },
    7: {
      multiple: false,
      options: [
        { label: "a) OAuth2 / OpenID" },
        { label: "b) JWT" },
        { label: "c) Usuario/contraseña" },
        { label: "d) Terceros" },
        { label: "e) No definido" },
      ],
    },
    8: {
      multiple: false,
      options: [
        { label: "a) Obligatorio" },
        { label: "b) Opcional" },
        { label: "c) Parcial" },
        { label: "d) No" },
        { label: "e) En evaluación" },
      ],
    },
    9: {
      multiple: false,
      options: [
        { label: "a) Sí, completo" },
        { label: "b) Parcial" },
        { label: "c) Limitado" },
        { label: "d) No" },
        { label: "e) No definido" },
      ],
    },
    10: {
      multiple: false,
      options: [
        { label: "a) Automatizado en tiempo real con proveedores" },
        { label: "b) Híbrido (digital + manual)" },
        { label: "c) Manual" },
        { label: "d) Parcial" },
        { label: "e) No implementado" },
      ],
    },
    11: {
      multiple: false,
      options: [
        { label: "a) Producción" },
        { label: "b) Desarrollo" },
        { label: "c) Planificación" },
        { label: "d) No" },
        { label: "e) No aplica" },
      ],
    },
    12: {
      multiple: true,
      options: [
        { label: "a) SPEI inmediato" },
        { label: "b) Internas" },
        { label: "c) Programadas" },
        { label: "d) Batch" },
        { label: "e) No definido" },
      ],
    },
    13: {
      multiple: false,
      options: [
        { label: "A. Totalmente definidos" },
        { label: "B. Parcialmente definidos" },
        { label: "C. Conceptual" },
        { label: "D. No definidos" },
      ],
    },
    14: {
      multiple: false,
      options: [
        { label: "A. Inventario completo" },
        { label: "B. Lista clara" },
        { label: "C. Parcial" },
        { label: "D. No definido" },
      ],
    },
    15: {
      multiple: false,
      options: [
        { label: "A. Definida (event-driven/híbrida)" },
        { label: "B. REST definida" },
        { label: "C. Preferencia sin formalizar" },
        { label: "D. No definida" },
      ],
    },
    16: {
      multiple: false,
      options: [
        { label: "A. Implementado con gobierno" },
        { label: "B. Middleware básico" },
        { label: "C. Punto a punto" },
        { label: "D. No existe" },
      ],
    },
    17: {
      multiple: false,
      options: [
        { label: "A. Estándares robustos (OAuth2, IAM)" },
        { label: "B. Básico" },
        { label: "C. Parcial" },
        { label: "D. No definido" },
      ],
    },
    18: {
      multiple: false,
      options: [
        { label: "A. Arquitectura completa definida" },
        { label: "B. Definición general" },
        { label: "C. Básica" },
        { label: "D. No definida" },
      ],
    },
    19: {
      multiple: false,
      options: [
        { label: "A. Definidas con SLA" },
        { label: "B. Definidas sin SLA" },
        { label: "C. Parcial" },
        { label: "D. No definidas" },
      ],
    },
  },
};

export const COMERCIAL_FORM: FormConfig = {
  questions: COMERCIAL_QUESTIONS,
  placeholders: COMERCIAL_PLACEHOLDERS,
  storageKey: "form-onboarding-comercial-answers",
  indices: {
    budgetQuestionIndex: 32, // Pregunta 33 (índice 32): Presupuesto asignado para digitalización
    servicesQuestionIndex: -1, // El formulario comercial ya no usa pregunta de servicios/MVP
    countryQuestionIndex: 4, // Pregunta 5 (índice 4): País(es) donde opera
  },
  selectQuestions: {
    // Pregunta 3 (índice 3): Tipo de institución - Selección única
    3: {
      multiple: false,
      options: [
        { label: "Banco" },
        { label: "Cooperativa" },
        { label: "Fintech" },
        { label: "Empresa" },
      ],
    },
    // Pregunta 4 (índice 4): País(es) donde opera - Selección múltiple
    4: {
      multiple: true,
      options: [
        { label: "Colombia" },
        { label: "Ecuador" },
        { label: "Estados Unidos" },
        { label: "México" },
      ],
    },
    // Pregunta 11 (índice 10): Canales digitales activos - Selección múltiple
    10: {
      multiple: true,
      options: [
        { label: "App móvil" },
        { label: "Web" },
        { label: "POS" },
      ],
    },
    // NOTA: La pregunta 12 (índice 11) "¿Tiene core bancario?..." NO debe estar aquí
    // Debe ser un campo de texto, NO selección múltiple
    // Pregunta 13 (índice 12): Servicios requeridos para el core bancario - Selección múltiple
    12: {
      multiple: true,
      options: [
        {
          label: "Gestión de clientes y usuarios",
          description:
            "Administración de personas y empresas, junto con control de accesos, roles y permisos dentro del sistema.",
        },
        {
          label: "Productos financieros",
          description:
            "Configuración y administración de créditos, cuentas de ahorro, cuentas corrientes y estructuras como líneas de crédito.",
        },
        {
          label: "Procesamiento transaccional",
          description:
            "Registro de movimientos financieros, ejecución de operaciones y cálculo de intereses sobre saldos y productos.",
        },
        {
          label: "Pagos y transferencias",
          description:
            "Ejecución de pagos locales e internacionales e integración con redes externas de dinero.",
        },
        {
          label: "Tarjetas",
          description:
            "Integración con proveedores para la emisión y gestión de tarjetas de débito o crédito.",
        },
        {
          label: "Contabilidad y auditoría",
          description:
            "Libro mayor, registro en doble entrada y trazabilidad completa de operaciones para cumplimiento regulatorio.",
        },
        {
          label: "Reportes y analítica",
          description:
            "Generación de información operativa, financiera y de negocio, junto con capacidades de análisis e insights.",
        },
        {
          label: "Notificaciones",
          description:
            "Comunicación automática con clientes y usuarios basada en eventos del sistema.",
        },
        {
          label: "Operaciones de caja",
          description:
            "Gestión de transacciones presenciales en sucursales o puntos físicos.",
        },
      ],
    },
    // NOTA: La pregunta 14 (índice 13) "Número de usuarios del sistema..." debe ser texto abierto
    // Pregunta 15 (índice 14): Módulos requeridos - Selección múltiple
    14: {
      multiple: true,
      options: [
        {
          label: "Depósitos y cuentas",
          description:
            "Gestión de cuentas de ahorro, cuentas corrientes, saldos y movimientos asociados.",
        },
        {
          label: "Préstamos y líneas de crédito",
          description:
            "Originación, administración de créditos, cuotas, cronogramas y líneas de financiamiento.",
        },
        {
          label: "Pagos y recaudos",
          description:
            "Pagos de servicios, cobranzas, dispersión de fondos y operaciones de recaudo.",
        },
        {
          label: "Transferencias",
          description:
            "Transferencias internas, interbancarias, inmediatas o programadas.",
        },
        {
          label: "Tarjetas",
          description:
            "Procesos asociados a emisión, administración y operación de tarjetas.",
        },
        {
          label: "Inversiones",
          description:
            "Productos y operaciones relacionadas con instrumentos de inversión y rendimiento.",
        },
      ],
    },
    // NOTA: La pregunta 16 (índice 15) "Monedas soportadas..." debe ser texto abierto
    // Pregunta 17 (índice 16): Canales requeridos - Selección múltiple
    16: {
      multiple: true,
      options: [
        { label: "Banca móvil", description: "Canal móvil para clientes finales y operaciones digitales." },
        { label: "Web", description: "Portal web transaccional o de autoservicio." },
        { label: "ATM", description: "Integración con cajeros automáticos y retiros." },
        { label: "Teller / caja", description: "Operación presencial en sucursales o puntos físicos." },
        { label: "POS", description: "Pagos y operaciones en terminales de punto de venta." },
      ],
    },
    // Pregunta 18 (índice 17): Timeline de implementación - Selección única
    17: {
      multiple: false,
      options: [
        { label: "0 a 3 meses", description: "Necesidad de salida muy rápida o despliegue inmediato." },
        { label: "3 a 6 meses", description: "Implementación prioritaria a corto plazo." },
        { label: "6 a 12 meses", description: "Proyecto planificado para el mediano plazo." },
        { label: "Más de 12 meses", description: "Iniciativa estratégica con horizonte extendido." },
      ],
    },
    // Pregunta 19 (índice 18): Infraestructura preferida - Selección única
    18: {
      multiple: false,
      options: [
        { label: "Cloud", description: "Infraestructura desplegada principalmente en la nube." },
        { label: "On-premise", description: "Infraestructura alojada en entornos propios o del cliente." },
        { label: "Híbrida", description: "Combinación de nube y componentes on-premise." },
      ],
    },
    // Pregunta 20 (índice 19): Requisitos de cumplimiento - Selección múltiple
    19: {
      multiple: true,
      options: [
        { label: "Basilea III", description: "Requisitos de gestión de riesgo y suficiencia patrimonial." },
        { label: "AML", description: "Controles de prevención de lavado de activos." },
        { label: "KYC", description: "Procesos de conocimiento e identificación del cliente." },
        { label: "PCI DSS", description: "Controles de seguridad para manejo de datos de tarjetas." },
        { label: "Regulación local", description: "Cumplimiento específico según regulador y país de operación." },
      ],
    },
    // NOTA: La pregunta 21 (índice 20) "Integraciones externas críticas..." NO debe estar aquí
    // Debe ser un campo de texto, NO selección múltiple
    // NOTA: La pregunta 22 (índice 21) "Tipos de transferencias interbancarias" NO debe estar aquí
    // Debe ser un campo de texto, NO selección
    // Pregunta 23 (índice 22): ¿Emiten tarjetas? - Selección única
    22: {
      multiple: false,
      options: [
        { label: "Sí" },
        { label: "No" },
      ],
    },
    // Pregunta 33 (índice 32): Presupuesto asignado - Selección única
    32: {
      multiple: false,
      options: [
        { label: "Sí" },
        { label: "No" },
      ],
    },
  },
  validationRules: {
    1: { // Pregunta 2 (índice 1): Cargo y responsabilidades
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{5,150}$/,
      errorMessage: "Por favor, describe tu cargo y responsabilidades con al menos 5 caracteres.",
      minLength: 5,
      maxLength: 150,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    2: { // Pregunta 3 (índice 2): Institución / Empresa
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-&()]{3,100}$/,
      errorMessage: "Por favor, ingresa el nombre de tu institución o empresa (mínimo 3 caracteres).",
      minLength: 3,
      maxLength: 100,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    5: { // Pregunta 6 (índice 5): Actividad principal de la institución
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-()]{10,200}$/,
      errorMessage: "Por favor, describe la actividad principal de tu institución con al menos 10 caracteres. Puedes incluir letras, números y signos de puntuación básicos.",
      minLength: 10,
      maxLength: 200,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    6: { // Pregunta 7 (índice 6): Problema principal que desean resolver
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-()]{15,300}$/,
      errorMessage: "Por favor, describe el problema principal con al menos 15 caracteres.",
      minLength: 15,
      maxLength: 300,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    7: { // Pregunta 8 (índice 7): Productos o servicios financieros actuales
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-()]{10,200}$/,
      errorMessage: "Por favor, describe los productos o servicios financieros actuales con al menos 10 caracteres. Puedes incluir letras, números y signos de puntuación básicos.",
      minLength: 10,
      maxLength: 200,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    8: { // Pregunta 9 (índice 8): Segmento de clientes atendido
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-()]{3,200}$/,
      errorMessage: "Por favor, describe el segmento de clientes con al menos 3 caracteres.",
      minLength: 3,
      maxLength: 200,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    9: { // Pregunta 10 (índice 9): Objetivo de negocio a 6/12 meses
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-()]{15,250}$/,
      errorMessage: "Por favor, describe el objetivo de negocio con al menos 15 caracteres.",
      minLength: 15,
      maxLength: 250,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    11: { // Pregunta 12 (índice 11): ¿Tiene core bancario?
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{2,200}$/,
      errorMessage: "Por favor, responde si tienes core bancario y cuál es (mínimo 2 caracteres).",
      minLength: 2,
      maxLength: 200,
      blockedWords: ["asdf", "xxx"],
    },
    13: { // Pregunta 14 (índice 13): Número de usuarios del sistema
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{5,200}$/,
      errorMessage: "Por favor, describe el número de usuarios del sistema con suficiente detalle.",
      minLength: 5,
      maxLength: 200,
      blockedWords: ["asdf", "xxx"],
    },
    15: { // Pregunta 16 (índice 15): Monedas soportadas
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{3,120}$/,
      errorMessage: "Por favor, indica las monedas soportadas con al menos 3 caracteres.",
      minLength: 3,
      maxLength: 120,
      blockedWords: ["asdf", "xxx"],
    },
    20: { // Pregunta 21 (índice 20): Integraciones externas críticas
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{3,250}$/,
      errorMessage: "Por favor, describe las integraciones externas.",
      minLength: 3,
      maxLength: 250,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    21: { // Pregunta 22 (índice 21): Tipos de transferencias interbancarias
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{5,200}$/,
      errorMessage: "Por favor, describe los tipos de transferencias con al menos 5 caracteres.",
      minLength: 5,
      maxLength: 200,
      blockedWords: ["no hay", "ninguna", "n/a", "no aplica", "nada", "asdf", "xxx"],
    },
    33: { // Pregunta 34 (índice 33): ¿Quién te refirió con nosotros?
      pattern: /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ0-9\s,.;:\-/()]{3,150}$/,
      errorMessage: "Por favor, indica quién te refirió con al menos 3 caracteres.",
      minLength: 3,
      maxLength: 150,
      blockedWords: ["asdf", "xxx"],
    },
  },
};
