# Justice Chain

A modern React application built with Vite, React Router, and Tailwind CSS for transparent and secure justice management.

## Features

- **React Router Integration** - Multi-page routing with a layout-based component structure
- **Tailwind CSS Styling** - Modern, responsive UI with utility-first CSS
- **Responsive Design** - Mobile-first approach that works on all device sizes
- **Component Architecture** - Clean, reusable component structure

## Project Structure

```
justice-chain/
├── src/
│   ├── components/
│   │   └── Layout.jsx         # Main layout with navigation
│   ├── pages/
│   │   ├── Home.jsx           # Home page
│   │   ├── About.jsx          # About page
│   │   ├── Services.jsx       # Services page
│   │   └── Contact.jsx        # Contact page
│   ├── App.jsx                # Main app component with routing
│   ├── main.jsx               # Entry point
│   └── index.css              # Tailwind CSS imports
├── index.html                 # HTML template
├── vite.config.js             # Vite configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── postcss.config.js          # PostCSS configuration
└── package.json               # Project dependencies
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

### Development

Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### Production Build

Build for production:
```bash
npm run build
```

Preview the production build:
```bash
npm run preview
```

## Pages

- **Home** - Welcome page with features overview
- **About** - Mission, vision, and company information
- **Services** - Detailed service offerings
- **Contact** - Contact form and business information

## Technologies Used

- **React** - UI library
- **React Router DOM** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## Navigation

The layout component provides a sticky navigation bar with links to all main pages:
- Home
- About
- Services
- Contact

## Styling

All styling is done with Tailwind CSS utility classes. The project includes:
- Custom CSS reset and base styles in `src/index.css`
- Responsive grid and flexbox layouts
- Hover and transition effects
- Form styling with focus states

## License

All rights reserved © 2026 Justice Chain
