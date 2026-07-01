const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const FormData = require('form-data');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

app.post('/generate', async (req, res) => {
    try {
        const { donatorUsername, donatorImage, raiserUsername, raiserImage, amount } = req.body;

        // 1. Color Logic (The exact logic you requested)
        let borderColor = "#FF00FF"; // 100-999 = Pink
        if (amount >= 10000000) {
            borderColor = "#FF0000"; // 10 Million+ = Red
        } else if (amount >= 1000) {
            borderColor = "#FF6699"; // 1,000+ = Light Reddish-Pink
        }

        // 2. Setup Canvas (800x250)
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');
        
        // Draw background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 800, 250);

        // 3. Helper to draw avatars
        const drawAvatar = async (url, x) => {
            const img = await loadImage(url);
            // Border
            ctx.beginPath();
            ctx.arc(x + 60, 125, 65, 0, Math.PI * 2);
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 10;
            ctx.stroke();
            // Clip/Draw Image
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 60, 125, 60, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x, 65, 120, 120);
            ctx.restore();
        };

        await drawAvatar(donatorImage, 50);
        await drawAvatar(raiserImage, 630);

        // 4. Draw Text
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(amount.toLocaleString(), 400, 80);
        ctx.font = 'bold 30px Arial';
        ctx.fillText("donated to", 400, 150);

        // 5. Send to Discord
        const buffer = canvas.toBuffer('image/png');
        const form = new FormData();
        form.append('payload_json', JSON.stringify({
            content: `New Donation!`,
            embeds: [{ image: { url: "attachment://donation.png" } }]
        }));
        form.append('file1', buffer, 'donation.png');

        await axios.post(process.env.WEBHOOK_URL, form, {
            headers: form.getHeaders()
        });

        res.status(200).send("Success: Image sent!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error generating image.");
    }
});

// Port configuration for Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
