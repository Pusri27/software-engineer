# Nebwork Frontend

<div align="center">

![Nebwork Logo](./src/assets/Logo/logo.png)

**Modern Collaborative Work Management Platform**

[🌐 Live Demo](https://nebwork.app) • [📖 Documentation](#documentation) • [🚀 Getting Started](#getting-started)

</div>

---

## 📋 Table of Contents

- [About](#about)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development](#development)
- [Building](#building)
- [Contributing](#contributing)
- [License](#license)

## 🎯 About

Nebwork is a comprehensive work management and collaboration platform designed to streamline team workflows, facilitate real-time communication, and enhance productivity. The frontend provides an intuitive interface for work logging, chat functionality, document editing, and team collaboration.

**Live Application:** [nebwork.app](https://nebwork.app)

## 🛠 Tech Stack

### Core Framework & Build Tools

- **[Vite](https://vitejs.dev/)** `^7.1.12` - Next generation frontend build tool with lightning-fast HMR
- **[React](https://react.dev/)** `^18.3.1` - Component-based UI library for building interactive interfaces
- **[React Router](https://reactrouter.com/)** `^6.30.1` - Declarative routing for React applications
- **[@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc)** - Uses SWC for Fast Refresh

### UI Components & Styling

- **[shadcn/ui](https://ui.shadcn.com/)** `^0.9.5` - Re-usable component collection built with Radix UI and Tailwind CSS
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled, accessible component primitives
  - Accordion, Alert Dialog, Avatar, Checkbox, Dialog, Dropdown Menu, Hover Card, Label, Menubar, Navigation Menu, Popover, Progress, Radio Group, Scroll Area, Select, Separator, Slider, Switch, Tabs, Toast, Toggle, Tooltip
- **[Tailwind CSS](https://tailwindcss.com/)** `^3.4.17` - Utility-first CSS framework
- **[tailwindcss-animate](https://github.com/jamiebuilds/tailwindcss-animate)** - Animation utilities for Tailwind CSS
- **[Lucide React](https://lucide.dev/)** `^0.462.0` - Beautiful & consistent icon toolkit
- **[next-themes](https://github.com/pacocoursey/next-themes)** - Theme management (dark/light mode)
- **[Sass](https://sass-lang.com/)** `^1.93.2` - CSS preprocessor for advanced styling

### Rich Text Editor

- **[Tiptap](https://tiptap.dev/)** `^3.10.1` - Headless editor framework for web applications
  - Extensions: Collaboration, Collaboration Caret, Highlight, Horizontal Rule, Image, Link, List, Placeholder, Subscript, Superscript, Text Align, Typography
  - Starter Kit included for common editor features
- **[Yjs](https://github.com/yjs/yjs)** `^13.6.27` - CRDT framework for building collaborative applications

### State Management & Data Fetching

- **[@tanstack/react-query](https://tanstack.com/query)** `^5.83.0` - Powerful asynchronous state management for React
- **[React Hook Form](https://react-hook-form.com/)** `^7.61.1` - Performant, flexible form validation library
- **[@hookform/resolvers](https://github.com/react-hook-form/resolvers)** - Validation resolvers for React Hook Form
- **[Zod](https://zod.dev/)** `^3.25.76` - TypeScript-first schema validation

### UI Utilities & Interactions

- **[@floating-ui/react](https://floating-ui.com/)** `^0.27.16` - Positioning library for tooltips, popovers, dropdowns
- **[cmdk](https://cmdk.paco.me/)** `^1.1.1` - Command palette interface
- **[vaul](https://vaul.emilkowal.ski/)** `^0.9.9` - Drawer component for mobile interfaces
- **[embla-carousel-react](https://www.embla-carousel.com/)** `^8.6.0` - Lightweight carousel library
- **[react-resizable-panels](https://github.com/bvaughn/react-resizable-panels)** `^2.1.9` - Resizable panel layouts
- **[react-hotkeys-hook](https://github.com/JohannesKlauss/react-hotkeys-hook)** `^5.2.1` - Keyboard shortcuts management
- **[sonner](https://sonner.emilkowal.ski/)** `^1.7.4` - Toast notifications

### Document & Data Visualization

- **[@cyntler/react-doc-viewer](https://www.npmjs.com/package/@cyntler/react-doc-viewer)** `^1.17.1` - Document preview component
- **[recharts](https://recharts.org/)** `^2.15.4` - Composable charting library for React
- **[react-day-picker](https://react-day-picker.js.org/)** `^8.10.1` - Date picker component
- **[date-fns](https://date-fns.org/)** `^3.6.0` - Modern JavaScript date utility library

### Security & Utilities

- **[DOMPurify](https://github.com/cure53/DOMPurify)** `^3.3.0` - XSS sanitizer for HTML, MathML and SVG
- **[class-variance-authority](https://cva.style/)** - Component variant management
- **[clsx](https://github.com/lukeed/clsx)** - Utility for constructing className strings
- **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind CSS classes without conflicts
- **[lodash.throttle](https://lodash.com/)** `^4.1.1` - Throttle utility function

### Development Tools

- **[ESLint](https://eslint.org/)** `^9.32.0` - JavaScript linter with React plugins
- **[TypeScript](https://www.typescriptlang.org/)** `^5.8.3` - Type checking and tooling support
- **[Jest](https://jestjs.io/)** `^30.2.0` - JavaScript testing framework
- **[@testing-library/react](https://testing-library.com/)** `^16.3.0` - Testing utilities for React
- **[PostCSS](https://postcss.org/)** - CSS transformation tool
- **[Autoprefixer](https://github.com/postcss/autoprefixer)** - PostCSS plugin for vendor prefixes

## ✨ Features

- 🔐 **Authentication & Authorization** - Secure login with protected routes and role-based access control
- 📝 **Work Log Management** - Create, edit, and track work logs with version history
- 💬 **Real-time Chat** - Integrated chatbot and messaging functionality
- 🤝 **Collaboration Tools** - Team collaboration with friends list and collaborative document editing
- 📄 **Rich Text Editor** - Powerful Tiptap-based editor with collaboration features
- 📊 **Document Management** - Preview and manage various document formats
- 🎨 **Modern UI/UX** - Beautiful, responsive interface with dark/light theme support
- 📱 **Mobile Responsive** - Fully responsive design for all device sizes
- 🔔 **Notifications** - Toast notifications and real-time updates
- 👤 **User Profiles** - Comprehensive user profile management
- 🛡️ **Admin Dashboard** - Administrative interface for system management
- 📖 **Blog System** - Create and publish blog posts with rich content

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/) or use [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)
- **npm** or **yarn** package manager
- **Git** for version control

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/kada-hackathon/front-end.git
   cd front-end
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Configure environment** (if needed)
   - Update API endpoints in `src/config/api.js`
   - Configure environment-specific settings

4. **Start development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   - Navigate to `http://localhost:8080`
   - The application will automatically reload on file changes

## 📁 Project Structure

```
front-end/
├── public/                    # Static assets
│   └── robots.txt            # SEO configuration
├── src/
│   ├── assets/               # Images, logos, and media files
│   │   └── Logo/            # Brand logos
│   ├── components/           # Reusable React components
│   │   ├── AdminRoute.jsx   # Admin route protection
│   │   ├── ProtectedRoute.jsx # Authentication guard
│   │   ├── ChatArea/        # Chat interface components
│   │   ├── ChatBot/         # AI chatbot component
│   │   ├── ChatHistory/     # Chat history sidebar
│   │   ├── CollabList/      # Collaboration user list
│   │   ├── DocumentViewer/  # Document preview modal
│   │   ├── FriendsList/     # Friends management
│   │   ├── HomeContent/     # Landing page content
│   │   ├── Menubar/         # Application menu bar
│   │   ├── Navbar/          # Navigation bar
│   │   ├── TiptapEditor/    # Rich text editor
│   │   ├── WorkLogList/     # Work log listing
│   │   ├── tiptap-icons/    # Custom editor icons
│   │   ├── tiptap-node/     # Custom Tiptap nodes
│   │   ├── tiptap-templates/ # Editor templates
│   │   ├── tiptap-ui/       # Tiptap UI components
│   │   ├── tiptap-ui-primitive/ # Tiptap primitives
│   │   └── ui/              # shadcn/ui components
│   ├── config/              # Configuration files
│   │   └── api.js          # API endpoints configuration
│   ├── hooks/               # Custom React hooks
│   │   ├── use-composed-ref.js
│   │   ├── use-cursor-visibility.js
│   │   ├── use-element-rect.js
│   │   ├── use-media-upload.js
│   │   ├── use-menu-navigation.js
│   │   ├── use-mobile.js
│   │   ├── use-scrolling.js
│   │   ├── use-throttled-callback.js
│   │   ├── use-tiptap-editor.js
│   │   ├── use-toast.js
│   │   ├── use-unmount.js
│   │   └── use-window-size.js
│   ├── lib/                 # Utility libraries
│   │   ├── document-utils.js # Document handling utilities
│   │   ├── media-constants.js # Media type constants
│   │   ├── media-manager.js  # Media upload manager
│   │   ├── tiptap-utils.js   # Tiptap helper functions
│   │   └── utils.js          # General utilities
│   ├── pages/               # Route page components
│   │   ├── Admin/          # Admin dashboard
│   │   ├── Login/          # Login page
│   │   ├── NewPassword/    # Password reset confirmation
│   │   ├── ResetPassword/  # Password reset request
│   │   ├── WorkLog/        # Work log pages
│   │   ├── BlogEditor.jsx  # Blog post editor
│   │   ├── BlogPost.jsx    # Blog post viewer
│   │   ├── ChatBotPage.jsx # Chatbot interface
│   │   ├── Index.jsx       # Home page
│   │   ├── NotFound.jsx    # 404 page
│   │   ├── Profile.jsx     # User profile
│   │   └── WorkLogVersion.jsx # Work log version history
│   ├── services/            # API service layers
│   │   └── authService.js  # Authentication services
│   ├── styles/              # Global styles
│   │   ├── _keyframe-animations.scss # Animation definitions
│   │   ├── _variables.scss  # SCSS variables
│   │   ├── global.css      # Global CSS styles
│   │   ├── reset.css       # CSS reset
│   │   └── variable.css    # CSS custom properties
│   ├── utils/               # Utility functions
│   │   ├── apiHandler.js   # API request handler
│   │   ├── authUtils.js    # Authentication utilities
│   │   ├── security.js     # Security helpers
│   │   └── validation.js   # Form validation
│   ├── App.css             # App component styles
│   ├── App.jsx             # Root App component
│   ├── index.css           # Entry point styles
│   └── main.jsx            # Application entry point
├── .eslintrc.config.js     # ESLint configuration
├── components.json         # shadcn/ui configuration
├── index.html              # HTML entry point
├── jsconfig.app.json       # JavaScript configuration
├── package.json            # Dependencies and scripts
├── postcss.config.js       # PostCSS configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Build for development environment
npm run build:dev

# Preview production build locally
npm run preview

# Start production preview on all network interfaces
npm start

# Run ESLint for code quality
npm run lint

# Run tests
npm run test
```

### Development Server

The development server runs on `http://localhost:8080` with:
- Hot Module Replacement (HMR)
- Fast Refresh for React components
- Automatic browser refresh on file changes
- Source maps for debugging

### Code Quality

- **ESLint** - Automatically enforces code style and best practices
- **React Hooks Rules** - Ensures correct usage of React Hooks
- **Type Checking** - TypeScript integration for better development experience

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode (for development)
npm run test -- --watch

# Generate test coverage report
npm run test -- --coverage
```

## 🏗 Building

### Production Build

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory:
- Minified JavaScript and CSS
- Code splitting for optimal loading
- Asset optimization and compression
- Source maps for debugging (optional)

### Preview Production Build

```bash
npm run preview
```

Test the production build locally before deployment.

### Deployment

The application is configured for deployment on:
- **Primary Domain:** [nebwork.app](https://nebwork.app)
- **DigitalOcean App Platform:** `frontend-he2bh.ondigitalocean.app`

Allowed hosts are configured in `vite.config.js` for security.

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository** on GitHub
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Make your changes** and commit them
   ```bash
   git add .
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to your branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request** on GitHub

### Commit Message Guidelines

- Use clear, descriptive commit messages
- Start with a verb in present tense (Add, Fix, Update, Remove)
- Reference issue numbers when applicable
- Examples:
  - `Add user authentication flow`
  - `Fix chat message rendering bug`
  - `Update dependencies to latest versions`

### Code Style Guidelines

- Follow ESLint rules configured in the project
- Use functional components with hooks
- Write clean, self-documenting code
- Add comments for complex logic
- Ensure all tests pass before submitting PR

### Reporting Issues

Found a bug or have a feature request? Please open an issue on GitHub with:
- Clear description of the issue/feature
- Steps to reproduce (for bugs)
- Expected vs actual behavior
- Screenshots (if applicable)
- Your environment details (OS, browser, Node version)

## 📄 License

This project is part of the Kada Hackathon initiative. All rights reserved.

---

## 📞 Contact & Support

- **Website:** [nebwork.app](https://nebwork.app)
- **Repository:** [github.com/kada-hackathon/front-end](https://github.com/kada-hackathon/front-end)
- **Issues:** [GitHub Issues](https://github.com/kada-hackathon/front-end/issues)

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Radix UI](https://www.radix-ui.com/) for accessible primitives
- [Tiptap](https://tiptap.dev/) for the collaborative editor
- [Vite](https://vitejs.dev/) for the blazing-fast build tool
- The entire React and open-source community

---

<div align="center">
  Made with ❤️ by the Nebwork Team
</div>
