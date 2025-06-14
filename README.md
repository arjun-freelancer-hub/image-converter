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

## Deployment (Render.com)

You can deploy this project for free on [Render.com](https://render.com):

1. Push your code to GitHub.
2. Sign up at [render.com](https://render.com) and click "New +" > "Web Service".
3. Connect your GitHub repository.
4. Render will auto-detect the `render.yaml` file and configure your service.
5. Click "Create Web Service".
6. After deployment, your app will be live at `https://your-app-name.onrender.com`.
7. (Optional) Set the `ALLOWED_ORIGIN` environment variable in the Render dashboard to your Render app URL for enhanced security.

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

## Using Multiple GitHub SSH Keys

If you use multiple GitHub accounts (e.g., personal and freelancer), configure your `~/.ssh/config` like this:

```ssh
# Freelancer Hub GitHub Account
Host github.com-freelancer
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519_github_work
    IdentitiesOnly yes

# Personal GitHub Account
Host github.com-personal
    HostName github.com
    User git
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Clone or set remotes using the appropriate alias:

```bash
# Freelancer repo
git clone git@github.com-freelancer:arjun-freelancer-hub/repo.git

# Personal repo
git clone git@github.com-personal:your-username/repo.git
```

## License

MIT 