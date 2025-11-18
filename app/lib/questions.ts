// Preguntas del formulario en orden secuencial
export const QUESTIONS = [
  '¿Cuál es su rol dentro de la organización y en qué áreas toma decisiones relacionadas con tecnología o servicios financieros?',
  '¿A qué actividad principal se dedica su empresa y qué productos financieros ofrecen actualmente?',
  '¿Cuál es el mayor problema o fricción que tienen hoy en sus procesos financieros o tecnológicos?',
  '¿Qué tipo de integraciones o servicios están buscando implementar (identidad, AML, pagos, tarjetas, transferencias, etc.)?',
  '¿Cómo manejan hoy el onboarding, pagos o transferencias y qué parte de ese proceso sigue siendo manual?',
  '¿Qué objetivos tienen para los próximos 6–12 meses en términos de nuevos productos o expansión digital?',
  '¿Tienen un presupuesto asignado o un proceso definido para evaluar e implementar soluciones como Zelify?',
  '¿Cuál sería para ustedes el resultado ideal al trabajar con Zelify?',
] as const;

// Placeholders personalizados para cada pregunta
export const PLACEHOLDERS = [
  'Ej: Director de Tecnología, tomo decisiones en integraciones y servicios financieros',
  'Ej: Somos una fintech que ofrece tarjetas de crédito y cuentas digitales',
  'Ej: Nuestro proceso de onboarding es muy lento y requiere mucha documentación manual',
  'Ej: Necesitamos integración de identidad, AML y procesamiento de pagos',
  'Ej: El onboarding es 80% manual, los pagos los procesamos con un sistema legacy',
  'Ej: Queremos lanzar nuevos productos digitales y expandirnos a otros países',
  'Ej: Tenemos un presupuesto de $500k y un proceso trimestral de evaluación',
  'Ej: Reducir el tiempo de onboarding en un 70% y automatizar nuestros procesos',
] as const;

export type QuestionIndex = number;

