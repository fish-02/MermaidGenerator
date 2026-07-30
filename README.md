# MermaidGenerator

## Windows 啟動方式

目前這個資料夾已經是專案根目錄，不要再執行 `cd MermaidGenerator`。

在 PowerShell 中執行：

```powershell
cd "C:\desk\Project test\MermaidGenerator"
npm.cmd run dev
```

也可以直接執行專案根目錄的 `start-dev.cmd`。啟動後開啟終端機顯示的網址（通常是 <http://localhost:5173>）。

若尚未安裝套件，先執行：

```powershell
npm.cmd install
```

## 部署到 Vercel

專案部署在 Vercel（而非 GitHub Pages——`fish-02.github.io` 這個網域被 Google Safe Browsing 誤判為危險網站，改用 Vercel 的獨立網域避開這個問題）。

Vercel 專案已連結這個 GitHub repository：推送到 `main` 分支後會自動觸發 build 並部署，設定為 Vite 預設值即可（Build Command `npm run build`、Output Directory `dist`）。

## Vite 說明

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.
