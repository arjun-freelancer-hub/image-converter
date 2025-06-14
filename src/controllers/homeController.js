const config = require('../config');

class HomeController {
    static async getHome(req, res) {
        res.render('index', {
            title: 'Image Converter',
            supportedFormats: config.supportedFormats
        });
    }
}

module.exports = HomeController; 