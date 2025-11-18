# Form Onboarding - Alaiza

Aplicación de onboarding con formulario interactivo construida con Next.js 14, TypeScript y Tailwind CSS.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Ejecutar servidor de desarrollo
npm run dev

# Construir para producción
npm run build

# Iniciar servidor de producción
npm start
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📁 Estructura del Proyecto

```
form-onboarding/
├── app/
│   ├── components/
│   │   ├── layout/          # Componentes de layout (Logo, ThemeToggle)
│   │   └── ui/              # Componentes de UI (AnimatedText, InputField)
│   ├── providers/           # Providers de React Context
│   ├── types/               # Tipos TypeScript globales
│   ├── lib/                 # Utilidades y constantes
│   ├── page.tsx             # Página principal
│   ├── layout.tsx           # Layout raíz
│   └── globals.css          # Estilos globales
├── public/
│   └── icons/               # Iconos SVG
└── ...
```

Para más detalles sobre la estructura, consulta [STRUCTURE.md](./STRUCTURE.md).

## 🛠️ Tecnologías

- **Next.js 14** - Framework React con App Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **next-themes** - Manejo de temas (dark/light mode)

## 📝 Componentes Principales

- **Logo**: Logo de Alaiza con icono SVG
- **ThemeToggle**: Switch para cambiar entre tema claro/oscuro
- **AnimatedText**: Texto con animación de letras dispersas
- **InputField**: Campo de entrada con botón de envío

## 🎨 Personalización

La animación del texto se puede personalizar en `app/components/ui/AnimatedText.tsx` modificando el objeto `ANIMATION_CONFIG`.
