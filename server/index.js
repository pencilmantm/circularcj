const express = require('express');
const puppeteer = require('puppeteer');
const cors = require('cors');
const path = require('path');
const app = express();

// Debug logging
const debug = (message, data = null) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`, data || '');
};

// Enable CORS and JSON parsing with increased limit
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../build')));

// Health check endpoint
app.get('/health', (req, res) => {
    debug('Health check requested');
    res.json({ status: 'healthy' });
});

// Screenshot endpoint
app.post('/api/capture', async (req, res) => {
    let browser = null;
    try {
        debug('Screenshot request received');
        const { html, css } = req.body;

        if (!html || !css) {
            throw new Error('Missing required html or css data');
        }
        
        debug('Launching browser');
        browser = await puppeteer.launch({
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-web-security'
            ]
        });
        
        const page = await browser.newPage();
        
        // Set viewport with high DPR for better quality
        await page.setViewport({
            width: 1920,
            height: 1080,
            deviceScaleFactor: 2
        });

        // Construct full HTML with necessary styles
        const fullHtml = `
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="UTF-8">
                    <style>
                        ${css}
                        body {
                            margin: 0;
                            background-color: #f3f4f6;
                            padding: 20px;
                        }
                        .capture-container {
                            transform: none !important;
                            -webkit-transform: none !important;
                        }
                    </style>
                </head>
                <body>
                    ${html}
                </body>
            </html>
        `;
        
        debug('Setting page content');
        await page.setContent(fullHtml, { 
            waitUntil: ['networkidle0', 'domcontentloaded']
        });
        
        // Wait for any animations and ensure proper rendering
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Find the capture container
        debug('Looking for capture container');
        const element = await page.$('.capture-container');
        if (!element) {
            throw new Error('Capture container not found');
        }

        // Get element dimensions
        const boundingBox = await element.boundingBox();
        if (!boundingBox) {
            throw new Error('Unable to determine element dimensions');
        }

        // Take the screenshot with padding
        // Assuming 'page' is a reference to a Puppeteer Page object
        debug('Taking screenshot');
        const padding = 80; // Total padding (20px padding on each side)

        // First, select the element by its class and get its bounding box
        const element = await page.$('.p-6');
        if (!element) {
            console.log('.p-6 element not found');
            return; // Exit if the element is not found
        }

        const boundingBox = await element.boundingBox();
        if (!boundingBox) {
            console.log('No bounding box available for .p-6');
            return; // Exit if the bounding box is not retrievable
        }

        // Now take the screenshot with the specified padding
        const screenshot = await element.screenshot({
            type: 'png',
            encoding: 'base64',
            clip: {
                x: boundingBox.x - padding / 2, // Subtract half of the total padding from the x-coordinate
                y: boundingBox.y - padding / 2, // Subtract half of the total padding from the y-coordinate
                width: boundingBox.width + padding, // Add full padding to the width
                height: boundingBox.height + padding // Add full padding to the height
            },
            omitBackground: false
        });
        
        debug('Screenshot captured successfully');
        res.json({ 
            success: true,
            screenshot: `data:image/png;base64,${screenshot}`
        });

    } catch (error) {
        debug('Screenshot error:', error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    } finally {
        if (browser) {
            debug('Closing browser');
            await browser.close();
        }
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    debug('Error middleware:', err);
    res.status(500).json({ 
        success: false,
        error: 'Internal server error'
    });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    debug(`Server running on http://localhost:${PORT}`);
    debug(`Health check available at http://localhost:${PORT}/health`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    debug('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
        debug('Server closed');
        process.exit(0);
    });
});