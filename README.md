# Docugine

A browser-based A4 document template designer. Compose multi-page A4 templates by placing elements on a canvas, edit text inline with Quill, insert `{{tag}}` placeholders that are merged with a JSON data payload, and export the whole document as JSON.

## Quick start

```bash
npm install            # one-time
npm start              # dev server on http://localhost:3000
npm test               # Jest in watch mode (react-scripts test)
npm run build          # production build into ./build
```

See [AGENTS.md](./AGENTS.md) for the full developer guide and [DATA-STRUCTURE.md](./DATA-STRUCTURE.md) for storage plans.

## KERAPIAN
### Penamaan
    - gunakan lowrcase kebab-case untuk file & folder:  kebab-case-for-file.tx
    - gunakan lowercase snake_case untuk variable: const variabel_baru = 0;
    - gunakan CamelCase dan arrow function untuk penamaan fungsi atau hooks: const FungsiBaru = () => {};
### Organisasi Kode
    src/
    ├── App.js                      # Top-level component, owns state
    ├── App.test.js                 # Smoke test
    ├── index.js                    # React root
    ├── index.css                   # Tailwind directives + global CSS
    ├── config/                     # konfigurasi default / default value
    ├── components/                 # All UI (Toolbar, panels, DesignCanvas, …)
    └── utils/                      # framework-free helpers
        ├── document.js             # Document model + factories + I/O
        ├── history.js              # Undo-tree
        ├── session.js              # localStorage current/history/sessions
        ├── templates.js            # Prebuilt template factories
        ├── colors.js               # Deterministic layer color
        ├── useBreakpoint.js        # Responsive breakpoint hook
        ├── useDevice.js            # Touch-only device detection
        ├── actions/                # Semua fungsi yang melakukan mutasi terhadap dokumen
        │   ├── elementActions.js   #   pure element-level mutations
        │   ├── pageActions.js      #   pure page-level mutations
        │   ├── docActions.js       #   pure doc-level mutations
        │   └── useDocumentActions.js # hook wiring the above to React state
        └── http/                   # Semua Http call di handle disini

## EFFISIENSI
    - Jangan mencampurkan UI dan core jadi satu file.
    - File UI atau yang berhubungan dengan tampilan disimpan dalam components.
    - File halaman atau page hanya berisi hooks seperti state, useEffect, dsb.
    - Jika fungsi melakukan mutasi atau aksi pada dokumen seperti (menambahkan elemen, merubah margin, dll) maka fungsi harus disimpan dalam utils/actions/
    - Jika fungsi berupa hal yang general atau berupa hooks seperti (penyimpanan sesi, template dokumen & elemen, hooks, zustand storage, dll) disimpan dalam utils/
    - folder config/ berisi konfigurasi default atau default value yang akan di gunakan dalam applikasi seperti (margin, headings, font-size, dll) hindari menulis default state atau default value (yang dapat di mutasi) pada file kode secara langsung
    - folder utils/http/ berisi konfigurasi http (axios) dan semua http api call (gunakan tipe yang kongkrit) jangan menggunakan seperti Record<generic, generic>[] bentuk data return harus sesuai dengan apa yang di return dari API.
    - gunakan Class component (OOP like) untuk semua utilitas HTTP.
