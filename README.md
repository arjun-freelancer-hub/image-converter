# Image Converter

A modern web application that allows users to convert images between different formats. Built with Node.js, Express, and Sharp for high-performance image processing.

## Features

- Convert images between various formats (PNG, JPEG, WEBP, GIF, etc.)
- Modern, responsive UI with Tailwind CSS
- Drag and drop interface
- Real-time image preview
- High-performance image processing with Sharp
- Automatic handling of transparency

## Setup

1. Install Node.js (v14 or higher) if you haven't already

2. Install dependencies:
```bash
npm install
```

3. Run the application:
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

4. Open your browser and navigate to `http://localhost:3000`

## Supported Formats

- PNG
- JPEG
- WEBP
- GIF
- BMP
- TIFF

## Technical Details

- Backend: Node.js with Express
- Image Processing: Sharp
- Frontend: HTML, Tailwind CSS, Dropzone.js
- File Upload: Multer
- Maximum file size: 16MB

## License

MIT 