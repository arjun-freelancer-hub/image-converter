const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const archiver = require('archiver');
const app = require('./src/app');
const config = require('./src/config');

const port = process.env.PORT || 3000;

// Set up Pug as the view engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGIN || 'https://your-app-name.onrender.com'
        : '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

// Add security headers
app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    next();
});

app.use(express.static('public'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configure multer for memory storage with no limits
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/bmp', 'image/tiff'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Invalid file type for ${file.originalname}. Only PNG, JPEG, GIF, WEBP, BMP, and TIFF are allowed.`));
        }
    }
});

// Ensure uploads directory exists
if (!fs.existsSync(config.uploadsDir)) {
    fs.mkdirSync(config.uploadsDir);
}

// Serve the main page
app.get('/', (req, res) => {
    res.render('index', {
        title: 'Image Converter',
        supportedFormats: ['PNG', 'JPEG', 'WEBP', 'GIF', 'BMP', 'TIFF', 'JPG']
    });
});

// Handle individual image conversion
app.post('/convert-single', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const targetFormat = req.body.format?.toLowerCase() || 'png';
        const allowedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'JPG'];

        if (!allowedFormats.includes(targetFormat)) {
            return res.status(400).json({ error: 'Target format not supported' });
        }

        // Convert the image using sharp
        let sharpInstance = sharp(req.file.buffer);

        // Handle transparency for JPEG conversion
        if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
            sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
        }

        // Convert to the target format
        const convertedBuffer = await sharpInstance
            .toFormat(targetFormat)
            .toBuffer();

        // Generate output filename
        const originalName = path.parse(req.file.originalname).name;
        const outputFilename = `${originalName}.${targetFormat}`;

        // Send the converted image
        res.setHeader('Content-Type', `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`);
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.send(convertedBuffer);

    } catch (error) {
        console.error('Conversion error:', error);
        res.status(500).json({
            error: error.message || 'Error converting image',
            filename: req.file?.originalname
        });
    }
});

// Handle batch image conversion
app.post('/convert-batch', upload.array('files'), async (req, res) => {
    // Set a longer timeout for this route
    req.setTimeout(300000); // 5 minutes timeout

    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files provided' });
        }

        // Limit the number of files that can be processed at once
        const MAX_FILES = 50;
        if (req.files.length > MAX_FILES) {
            return res.status(400).json({
                error: `Too many files. Maximum ${MAX_FILES} files allowed per batch.`
            });
        }

        const targetFormat = req.body.format?.toLowerCase() || 'png';
        const allowedFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'tiff', 'JPG'];

        if (!allowedFormats.includes(targetFormat)) {
            return res.status(400).json({ error: 'Target format not supported' });
        }

        // Create a zip archive with a smaller chunk size
        const archive = archiver('zip', {
            zlib: { level: 6 }, // Reduced compression level for better performance
            store: true // Store files without compression for better performance
        });

        // Set the response headers
        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=converted_images.zip');

        // Handle archive errors
        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error creating zip archive' });
            }
        });

        // Pipe the archive to the response
        archive.pipe(res);

        // Process each file
        const results = {
            successful: [],
            failed: []
        };

        // Process files in smaller chunks to reduce memory usage
        const chunkSize = 5; // Reduced chunk size
        for (let i = 0; i < req.files.length; i += chunkSize) {
            const chunk = req.files.slice(i, i + chunkSize);
            const chunkPromises = chunk.map(async (file) => {
                try {
                    // Check file size before processing
                    const maxFileSize = 10 * 1024 * 1024; // 10MB limit
                    if (file.size > maxFileSize) {
                        throw new Error(`File ${file.originalname} is too large. Maximum size is 10MB.`);
                    }

                    // Convert the image using sharp with memory optimization
                    let sharpInstance = sharp(file.buffer, {
                        limitInputPixels: 100000000, // Limit input pixels to prevent memory issues
                        sequentialRead: true // Enable sequential reading for better memory usage
                    });

                    // Handle transparency for JPEG conversion
                    if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                        sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
                    }

                    // Convert to the target format with quality settings
                    const convertedBuffer = await sharpInstance
                        .toFormat(targetFormat, {
                            quality: 80, // Reduced quality for better performance
                            effort: 4 // Reduced effort for better performance
                        })
                        .toBuffer();

                    // Generate output filename
                    const originalName = path.parse(file.originalname).name;
                    const outputFilename = `${originalName}.${targetFormat}`;

                    // Add the converted file to the archive
                    archive.append(convertedBuffer, { name: outputFilename });
                    results.successful.push({
                        originalName: file.originalname,
                        convertedName: outputFilename
                    });

                    // Clear the buffer to free memory
                    file.buffer = null;

                } catch (error) {
                    console.error(`Error converting ${file.originalname}:`, error);
                    results.failed.push({
                        filename: file.originalname,
                        error: error.message
                    });
                }
            });

            // Wait for the current chunk to complete before processing the next
            await Promise.all(chunkPromises);

            // Force garbage collection after each chunk
            if (global.gc) {
                global.gc();
            }
        }

        // Add a results summary to the archive
        const summary = {
            total: req.files.length,
            successful: results.successful.length,
            failed: results.failed.length,
            failedFiles: results.failed
        };

        archive.append(JSON.stringify(summary, null, 2), { name: 'conversion_summary.json' });

        // Finalize the archive
        await archive.finalize();

        // Store results in memory for the frontend to access
        req.app.locals.lastConversionResults = results;

    } catch (error) {
        console.error('Batch conversion error:', error);
        if (!res.headersSent) {
            res.status(500).json({
                error: error.message || 'Error converting images',
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }
});

// Get conversion results
app.get('/conversion-results', (req, res) => {
    const results = req.app.locals.lastConversionResults || { successful: [], failed: [] };
    res.json(results);
});

// Error handling middleware
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message || 'Internal server error' });
});

// Increase the maximum payload size
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Start server
app.listen(config.port, () => {
    console.log(`Server running at http://localhost:${config.port}`);
}); 