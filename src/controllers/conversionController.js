const ConversionService = require('../services/conversionService');
const archiver = require('archiver');
const config = require('../config');

class ConversionError extends Error {
    constructor(message, details = {}) {
        super(message);
        this.name = 'ConversionError';
        this.code = 'CONVERSION_ERROR';
        Object.assign(this, details);
    }
}

class ConversionController {
    static async convertSingle(req, res, next) {
        try {
            if (!req.file) {
                throw new ConversionError('No file provided', { code: 'NO_FILE' });
            }

            const targetFormat = req.body.format?.toLowerCase() || 'png';

            // Validate format
            if (!config.supportedFormats.map(f => f.toLowerCase()).includes(targetFormat)) {
                throw new ConversionError('Unsupported format', {
                    code: 'UNSUPPORTED_FORMAT',
                    format: targetFormat,
                    supportedFormats: config.supportedFormats.map(f => f.toLowerCase())
                });
            }

            const convertedBuffer = await ConversionService.convertSingleImage(req.file.buffer, targetFormat)
                .catch(error => {
                    throw new ConversionError('Failed to convert image', {
                        format: targetFormat,
                        filename: req.file.originalname,
                        reason: error.message
                    });
                });

            if (!convertedBuffer) {
                throw new ConversionError('Conversion produced no output', {
                    format: targetFormat,
                    filename: req.file.originalname
                });
            }

            // Generate output filename
            const originalName = req.file.originalname.split('.')[0];
            const outputFilename = `${originalName}.${targetFormat}`;

            // Send the converted image
            res.setHeader('Content-Type', `image/${targetFormat === 'jpg' ? 'jpeg' : targetFormat}`);
            res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
            res.send(convertedBuffer);

        } catch (error) {
            next(error); // Pass to error handler
        }
    }

    static async convertBatch(req, res, next) {
        try {
            if (!req.files || req.files.length === 0) {
                throw new ConversionError('No files provided', { code: 'NO_FILES' });
            }

            const targetFormat = req.body.format?.toLowerCase() || 'png';

            // Validate format
            if (!config.supportedFormats.map(f => f.toLowerCase()).includes(targetFormat)) {
                throw new ConversionError('Unsupported format', {
                    code: 'UNSUPPORTED_FORMAT',
                    format: targetFormat,
                    supportedFormats: config.supportedFormats.map(f => f.toLowerCase())
                });
            }

            // Create a zip archive
            const archive = archiver('zip', {
                zlib: { level: config.compressionLevel }
            });

            // Set the response headers
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', 'attachment; filename=converted_images.zip');

            // Handle archive errors
            archive.on('error', (err) => {
                throw new ConversionError('Failed to create zip archive', {
                    reason: err.message
                });
            });

            // Pipe the archive to the response
            archive.pipe(res);

            // Process the files
            const results = await ConversionService.processBatchConversion(req.files, targetFormat)
                .catch(error => {
                    throw new ConversionError('Batch conversion failed', {
                        reason: error.message
                    });
                });

            // Add converted files to the archive
            for (const file of results.successful) {
                archive.append(file.buffer, { name: file.convertedName });
            }

            // Add conversion summary
            const summary = ConversionService.generateConversionSummary(results, req.files.length);
            archive.append(JSON.stringify(summary, null, 2), { name: 'conversion_summary.json' });

            // Store results in memory for the frontend
            req.app.locals.lastConversionResults = results;

            // Finalize the archive
            await archive.finalize();

        } catch (error) {
            next(error); // Pass to error handler
        }
    }

    static getConversionResults(req, res, next) {
        try {
            const results = req.app.locals.lastConversionResults || { successful: [], failed: [] };
            res.json(results);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = ConversionController; 