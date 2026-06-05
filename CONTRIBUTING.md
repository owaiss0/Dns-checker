# Contributing to DNS Speed Test

Thank you for your interest in contributing to DNS Speed Test! We welcome pull requests, bug reports, and suggestions.

---

## 🛠️ Local Development Setup

To get a local copy of the repository up and running, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/dns-test.git
   cd dns-test
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser to view the application.

---

## 🧼 Code Quality & Guidelines

To ensure consistency and quality across the codebase, please make sure your changes pass all checks:

- **Linting**: We use ESLint. Check code style with:
  ```bash
  npm run lint
  ```
- **TypeScript**: Ensure all typescript files compile successfully without type errors:
  ```bash
  npx tsc --noEmit
  ```
- **Building**: Validate the Next.js compilation before submitting:
  ```bash
  npm run build
  ```

---

## 📬 Pull Request Workflow

1. Fork this repository and create a new branch for your feature or fix:
   ```bash
   git checkout -b feature/your-awesome-feature
   ```
2. Commit your changes with clear, descriptive commit messages.
3. Make sure tests, linting, and TypeScript checks pass.
4. Push your branch to GitHub and submit a Pull Request targeting the `main` branch.
