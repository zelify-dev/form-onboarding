export type SelectOption = {
  label: string;
  description?: string;
};

export type SelectQuestionConfig = {
  options: SelectOption[];
  multiple: boolean; // true para checkboxes, false para radio buttons
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
  // Sección 1
  "1. Nombre y apellido",
  "2. Cargo y responsabilidades",
  "3. Productos o servicios financieros actuales",
  "4. Funcionalidades requeridas para el MVP. Puede elegir varias opciones.",
  // Sección 2 (Técnico)
  "5. ¿Ha hecho integraciones básicas vía API Rest o servicios para un tercero?",
  "6. Principales proveedores tecnológicos para servicios digitales",
  "7. ¿Utilizan webhooks o eventos en tiempo real?",
  "8. ¿Cuál es el método actual de autenticación de usuarios y manejo de sesión?",
  "9. ¿Implementan doble factor de autenticación (2FA)?",
  "10. ¿Recolectan información de dispositivo y geolocalización?",
  "11. Describa el proceso actual de validación de identidad en caso de que aplique.",
  "12. ¿Ejecutan validación AML/listas negras en el flujo y qué herramientas utilizan para ello?",
  "13. ¿Manejan billetera móvil?",
  "14. ¿Cuáles son los tipos de transferencias interbancarias? Especifique.",
  "15. ¿Quién te refirió con nosotros?",
];

const TECH_PLACEHOLDERS = [
  // Sección 1 — Negocio

  // 1. Nombre y apellido
  "Ej: Xavier García",

  // 2. Cargo y responsabilidades
  "Ej: Director de Tecnología, responsable de infraestructura y desarrollo",

  // 3. Productos o servicios financieros actuales
  "Ej: Cuentas de ahorro, tarjetas de débito, microcréditos",

  // 4. Funcionalidades requeridas para el MVP
  "Ej: Auth, Identity, AML y Transfers",

  // Sección 2 — Técnico

  // 5. Integraciones vía API REST
  "Ej: Sí, hemos realizado integraciones vía APIs REST con terceros",

  // 6. Proveedores tecnológicos principales
  "Ej: AWS, Fiserv y proveedores locales de pagos",

  // 7. Uso de webhooks o eventos en tiempo real
  "Ej: Sí, usamos webhooks para notificaciones transaccionales, ademas de notificiónes de inicio de sesión",

  // 8. Método de autenticación y manejo de sesión
  "Ej: Usuario y contraseña con refuerzo OTP",

  // 9. Implementación de 2FA
  "Ej: Sí, OTP vía SMS y correo electrónico",

  // 10. Recolección de dispositivo y geolocalización
  "Ej: Huella del dispositivo y ubicación aproximada",

  // 11. Proceso de validación de identidad
  "Ej: Validación biométrica y verificación documental",

  // 12. Validación AML y herramientas utilizadas
  "Ej: Consulta de listas AML mediante proveedor externo",

  // 13. Manejo de billetera móvil
  "Ej: Sí, ofrecemos wallet con saldo en USD",

  // 14. Tipos de transferencias interbancarias
  "Ej: Transferencias P2P, ACH y SPI",

  // 15. Referido
  "Ej: Referido por María Gómez (partner Zelify)",
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

  // Sección 5 — MVP
  "13. Funcionalidades requeridas para el MVP",

  // Sección 6 — Integraciones
  "14. Integraciones externas críticas (core, pagos, validación de identidad, cumplimiento)",

  // Sección 7 — Pagos y tarjetas
  "15. Tipos de transferencias interbancarias",
  "16. ¿Emiten tarjetas (débito, crédito o prepago)?",

  // Sección 8 — Métricas operativas
  "17. TPV (Monto total transaccionado): ¿Cuál es el valor total de dinero que estimas que se moverá en todo 2026?",
  "18. TPN (Total de transacciones procesadas): ¿Cuántas transacciones en total estimas procesar en todo 2026?",
  "19. TA (Número total de tarjetas activas): ¿Cuántas tarjetas activas estimas tener al 31 de diciembre de 2026?",
  "20. Número de depósitos al mes por cliente",
  "21. Retiros mensuales por cliente: En promedio, ¿cuántos retiros hará cada cliente al mes en 2026?",
  "22. Gasto mensual estimado por usuario: En promedio, ¿cuánto dinero estimas que cada usuario gastará al mes en 2026?",
  "23. Ingresos mensuales estimados por usuario: En promedio, ¿cuánto dinero ingresará cada usuario al mes en 2026?",

  // Sección 9 — Proyección
  "24. Usuarios estimados (año 1 y año 2): ¿Cuántos usuarios activos estimas tener al cierre del Año 1 y al cierre del Año 2 desde tu lanzamiento?",
  "25. Número de transferencias interbancarias mensuales estimadas",

  // Sección 10 — Presupuesto y referencia
  "26. Presupuesto asignado para digitalización",
  "27. ¿Quién te refirió con nosotros?"
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

  // Sección 5 — MVP
  "Ej: Auth, Identity, AML, Pagos, Tarjetas",

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
    servicesQuestionIndex: 3, // Pregunta 4 (índice 3): Funcionalidades requeridas para el MVP
    countryQuestionIndex: -1, // El formulario técnico NO tiene pregunta de países
  },
  selectQuestions: {
    // Pregunta 4 (índice 3): Funcionalidades requeridas para el MVP - Selección múltiple
    3: {
      multiple: true,
      options: [
        { label: "Autenticación", description: "Autenticación segura y gestión de accesos" },
        { label: "Identidad", description: "Verificación y validación de identidad" },
        { label: "AML (prevención de lavado de dinero)", description: "Prevención de lavado de activos/antifraude y cumplimiento" },
        { label: "Conexión", description: "Integración y conexión con sistemas externos" },
        { label: "Transacciones Internacionales", description: "Procesamiento de transacciones financieras internacionales" },
        { label: "Pagos & transferencias", description: "Transferencias bancarias y transacciones. Sistema de pagos y cobros digitales" },
        { label: "Descuentos", description: "Gestión de descuentos y promociones" },
        { label: "Alaiza IA", description: "Inteligencia artificial para tus servicios financieros" },
        { label: "Tarjetas", description: "Emisión y gestión de tarjetas de débito" },
      ],
    },
  },
};

export const COMERCIAL_FORM: FormConfig = {
  questions: COMERCIAL_QUESTIONS,
  placeholders: COMERCIAL_PLACEHOLDERS,
  storageKey: "form-onboarding-comercial-answers",
  indices: {
    budgetQuestionIndex: 25, // Pregunta 26 (índice 25): Presupuesto asignado para digitalización
    servicesQuestionIndex: 12, // Pregunta 13 (índice 12): Funcionalidades requeridas para el MVP
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
    // Pregunta 13 (índice 12): Funcionalidades requeridas para el MVP - Selección múltiple
    12: {
      multiple: true,
      options: [
        { label: "Autenticación", description: "Autenticación segura y gestión de accesos" },
        { label: "Identidad", description: "Verificación y validación de identidad" },
        { label: "AML (prevención de lavado de dinero)", description: "Prevención de lavado de activos/antifraude y cumplimiento" },
        { label: "Conexión", description: "Integración y conexión con sistemas externos" },
        { label: "Transacciones Internacionales", description: "Procesamiento de transacciones financieras internacionales" },
        { label: "Pagos & Transferencias", description: "Transferencias bancarias y transacciones. Sistema de pagos y cobros digitales" },
        { label: "Descuentos", description: "Gestión de descuentos y promociones" },
        { label: "Alaiza IA", description: "Inteligencia artificial para tus servicios financieros" },
        { label: "Tarjetas", description: "Emisión y gestión de tarjetas de débito" },
      ],
    },
    // NOTA: La pregunta 14 (índice 13) "Integraciones externas críticas..." NO debe estar aquí
    // Debe ser un campo de texto, NO selección múltiple
    // NOTA: La pregunta 15 (índice 14) "Tipos de transferencias interbancarias" NO debe estar aquí
    // Debe ser un campo de texto, NO selección
    // Pregunta 16 (índice 15): ¿Emiten tarjetas? - Selección única
    15: {
      multiple: false,
      options: [
        { label: "Sí" },
        { label: "No" },
      ],
    },
    // Pregunta 26 (índice 25): Presupuesto asignado - Selección única
    25: {
      multiple: false,
      options: [
        { label: "Sí" },
        { label: "No" },
      ],
    },
  },
};
