# Lemon Frontend

A modern web application built with React, TypeScript, and Vite, featuring authentication, product management, and more.

## 🚀 Features

- 🔐 Authentication (Login, Register, Password Reset)
- 🛍️ Product Management
- 🎨 Responsive UI with Tailwind CSS
- ⚡ Fast Development with Vite
- 🔍 Type Safety with TypeScript
- 🛠️ ESLint & Prettier for Code Quality

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase project (for authentication and database)

### Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/lemon-frontend.git
   cd lemon-frontend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn
   ```

3. Create a `.env` file in the root directory and add your environment variables:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## 🧪 Testing

Run tests with:
```bash
npm test
# or
yarn test
```

## 🏗️ Building for Production

To create a production build:

```bash
npm run build
# or
yarn build
```

The build artifacts will be stored in the `dist/` directory.

## 📦 Tech Stack

- [React](https://reactjs.org/) - UI Library
- [TypeScript](https://www.typescriptlang.org/) - Type Safety
- [Vite](https://vitejs.dev/) - Build Tool
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Supabase](https://supabase.com/) - Backend Services
- [React Router](https://reactrouter.com/) - Routing
- [React Hook Form](https://react-hook-form.com/) - Form Handling
- [ESLint](https://eslint.org/) - Code Linting
- [Prettier](https://prettier.io/) - Code Formatting

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Vite](https://vitejs.dev/) for the amazing development experience
- [Tailwind CSS](https://tailwindcss.com/) for the utility-first CSS framework
- [Supabase](https://supabase.com/) for the open-source Firebase alternative
