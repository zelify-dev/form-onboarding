# Estructura del Proyecto

Este documento explica la organización de carpetas y archivos del proyecto.

## 📁 Estructura de Carpetas

```
form-onboarding/
├── app/                          # Directorio principal de Next.js (App Router)
│   ├── components/               # Componentes React reutilizables
│   │   ├── layout/              # Componentes de layout (header, footer, etc.)
│   │   │   ├── Logo.tsx         # Logo de Alaiza
│   │   │   └── ThemeToggle.tsx  # Switch de tema (claro/oscuro)
│   │   └── ui/                  # Componentes de UI/interfaz
│   │       ├── AnimatedText.tsx # Texto con animación de letras dispersas
│   │       └── InputField.tsx   # Campo de entrada con botón de envío
│   ├── providers/               # Providers de React Context
│   │   └── ThemeProvider.tsx    # Provider para manejo de temas
│   ├── types/                   # Tipos TypeScript globales
│   │   └── index.ts
│   ├── lib/                     # Utilidades y funciones helper
│   │   └── constants.ts
│   ├── page.tsx                 # Página principal (Home)
│   ├── layout.tsx               # Layout raíz de la aplicación
│   └── globals.css              # Estilos globales
│
├── public/                      # Archivos estáticos
│   └── icons/                   # Iconos SVG
│       └── iconAlaiza.svg
│
├── package.json                 # Dependencias del proyecto
├── tsconfig.json                # Configuración de TypeScript
├── next.config.ts               # Configuración de Next.js
└── README.md                    # Documentación principal
```

## 📂 Descripción de Carpetas

### `app/components/layout/`
Componentes relacionados con la estructura y layout de la página:
- **Logo.tsx**: Componente del logo de Alaiza con icono SVG
- **ThemeToggle.tsx**: Switch para cambiar entre tema claro y oscuro

### `app/components/ui/`
Componentes de interfaz de usuario reutilizables:
- **AnimatedText.tsx**: Componente de texto animado con efecto de letras dispersas
- **InputField.tsx**: Campo de entrada con botón de envío integrado

### `app/providers/`
Providers de React Context para estado global:
- **ThemeProvider.tsx**: Maneja el estado del tema (dark/light mode)

### `app/types/`
Definiciones de tipos TypeScript compartidos en el proyecto.

### `app/lib/`
Funciones utilitarias y constantes:
- **constants.ts**: Constantes globales del proyecto

### `public/icons/`
Iconos SVG y assets estáticos.

## 🎨 Páginas

### `app/page.tsx`
Página principal (Home) que contiene:
- Header con Logo y ThemeToggle
- Contenido centrado con pregunta animada
- Campo de entrada para el formulario

## 🔧 Configuración

- **TypeScript**: Configurado en `tsconfig.json`
- **Next.js**: Configurado en `next.config.ts`
- **Tailwind CSS**: Configurado en `app/globals.css`
- **Temas**: Gestionado con `next-themes` en `ThemeProvider`

## 📝 Convenciones

- Los componentes usan TypeScript
- Los componentes de UI son client components (`'use client'`)
- Los componentes de layout pueden ser server o client components
- Los estilos usan Tailwind CSS
- Los iconos están en formato SVG en `public/icons/`

