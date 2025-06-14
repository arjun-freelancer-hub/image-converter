const sharp = require('sharp');
const path = require('path');
const config = require('../config');

class ConversionService {
    static async convertSingleImage(buffer, targetFormat) {
        try {
            if (!config.supportedFormats.map(f => f.toLowerCase()).includes(targetFormat)) {
                throw new Error('Target format not supported');
            }

            let sharpInstance = sharp(buffer);

            // Handle transparency for JPEG conversion
            if (targetFormat === 'jpg' || targetFormat === 'jpeg') {
                sharpInstance = sharpInstance.flatten({ background: { r: 255, g: 255, b: 255 } });
            }

            const convertedBuffer = await sharpInstance
                .toFormat(targetFormat)
                .toBuffer();

            return convertedBuffer;
        } catch (error) {
            throw new Error(`Conversion error: ${error.message}`);
        }
    }

    static async processBatchConversion(files, targetFormat) {
        const results = {
            successful: [],
            failed: []
        };

        // Process files in chunks
        for (let i = 0; i < files.length; i += config.chunkSize) {
            const chunk = files.slice(i, i + config.chunkSize);
            const chunkPromises = chunk.map(async (file) => {
                try {
                    const convertedBuffer = await this.convertSingleImage(file.buffer, targetFormat);
                    const originalName = path.parse(file.originalname).name;
                    const outputFilename = `${originalName}.${targetFormat}`;

                    results.successful.push({
                        originalName: file.originalname,
                        convertedName: outputFilename,
                        buffer: convertedBuffer
                    });
                } catch (error) {
                    results.failed.push({
                        filename: file.originalname,
                        error: error.message
                    });
                }
            });

            await Promise.all(chunkPromises);
        }

        return results;
    }

    static generateConversionSummary(results, totalFiles) {
        return {
            total: totalFiles,
            successful: results.successful.length,
            failed: results.failed.length,
            failedFiles: results.failed
        };
    }
}

module.exports = ConversionService; 