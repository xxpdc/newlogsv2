const express = require('express');
const { createCanvas, loadImage, registerFont } = require('canvas');
const axios = require('axios');
const app = express();

app.use(express.json());

// Replace with your real Discord Webhook URL 
const DISCORD_WEBHOOK = process.env.WEBHOOK_URL;

app.post('/generate', async (req, res) => {
    try {
        const { donatorUsername, donatorImage, raiserUsername, raiserImage, amount } = req.body;

        // 1. Color Logic
        const getTheme = (amt) => {
            if (amt >= 10000000) return "#FF0000"; // 10M = Red
            if (amt >= 1000) return "#FF6699";     // 1k = Light Reddish-Pink
            return "#FF00FF";                      // 100 = Pink
        };
        const color = getTheme(amount);

        // 2. Setup Canvas (800x250)
        const canvas = createCanvas(800, 250);
        const ctx = canvas.getContext('2d');

        // Draw Background (White to Light Pink Gradient)
        const gradient = ctx.createLinearGradient(0, 0, 800, 0);
        gradient.addColorStop(0, '#FFFFFF');
        gradient.addColorStop(1, '#FFDDDD');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 800, 250);

        // 3. Helper to draw avatars with thick colored borders
        const drawAvatar = async (url, x) => {
            const img = await loadImage(url);
            // Border
            ctx.beginPath();
            ctx.arc(x + 60, 125, 65, 0, Math.PI * 2);
            ctx.strokeStyle = color;
            ctx.lineWidth = 10;
            ctx.stroke();
            // Image Clip
            ctx.save();
            ctx.beginPath();
            ctx.arc(x + 60, 125, 60, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, x, 65, 120, 120);
            ctx.restore();
        };

        await drawAvatar(donatorImage, 50);
        await drawAvatar(raiserImage, 630);

        // 4. Draw Text & Amount
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(amount.toLocaleString(), 400, 80);
        ctx.font = 'bold 30px Arial';
        ctx.fillText("donated to", 400, 150);

        // 5. Send to Discord
        const buffer = canvas.toBuffer('image/png');
        await axios.post(DISCORD_WEBHOOK, {
            embeds: [{
                image: { url: "attachment://donation.png" }
            }]
        });

        res.status(200).send("Image Sent!");
    } catch (err) {
        console.error(err);
        res.status(500).send("Failed");
    }
});

app.listen(process.env.PORT || 3000);
