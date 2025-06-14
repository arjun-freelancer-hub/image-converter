const multer = require('multer');

class ErrorHandler {
    static handle(err, req, res, next) {
        // Log detailed error information
        console.error('Error details:', {
            message: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code,
            path: req.path,
            method: req.method,
            timestamp: new Date().toISOString()
        });

        // Handle multer errors
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                error: err.message,
                code: 'MULTER_ERROR',
                details: {
                    field: err.field,
                    code: err.code
                }
            });
        }

        // Handle validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({
                error: err.message,
                code: 'VALIDATION_ERROR',
                details: err.details || {}
            });
        }

        // Handle conversion errors
        if (err.name === 'ConversionError' || err.code === 'CONVERSION_ERROR') {
            return res.status(400).json({
                error: err.message || 'Image conversion failed',
                code: 'CONVERSION_ERROR',
                details: {
                    format: err.format,
                    filename: err.filename,
                    reason: err.reason
                }
            });
        }

        // Handle file system errors
        if (err.code && err.code.startsWith('ENOENT')) {
            return res.status(404).json({
                error: 'File not found',
                code: 'FILE_NOT_FOUND',
                details: { path: err.path }
            });
        }

        // Handle unsupported format errors
        if (err.code === 'UNSUPPORTED_FORMAT') {
            return res.status(400).json({
                error: 'Unsupported image format',
                code: 'UNSUPPORTED_FORMAT',
                details: { format: err.format }
            });
        }

        // Handle memory errors
        if (err.code === 'ERR_MEMORY_LIMIT') {
            return res.status(413).json({
                error: 'File too large to process',
                code: 'FILE_TOO_LARGE',
                details: { maxSize: err.maxSize }
            });
        }

        // Handle any other errors
        res.status(500).json({
            error: err.message || 'Internal server error',
            code: 'INTERNAL_ERROR',
            details: process.env.NODE_ENV === 'development' ? {
                stack: err.stack,
                name: err.name
            } : undefined
        });
    }
}

module.exports = ErrorHandler; 