const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const axios = require('axios');
const app = express();

app.use(express.json());

// REPLACE THIS WITH YOUR ACTUAL DISCORD WEBHOOK URL
const DISCORD_WEBHOOK = "YOUR_DISCORD_WEBHOOK_URL_HERE";

app.post('/generate', async (req, res) => {
    const { donatorUsername, donatorImage, raiserUsername, raiserImage, amount } = req.body;

    // 1. Color Logic
    let borderColor = "#FF00FF"; // 100 = Pink
    if (amount >= 10000000) {
        borderColor = "#FF0000"; // 10M = Red
    } else if (amount >= 1000) {
        borderColor = "#FF6699"; // 1k = Light Reddish-Pink
    }

    // 2. Canvas Setup
    const canvas = createCanvas(800, 250);
    const ctx = canvas.getContext('2d');
    
    // Draw Background
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, 800, 250);

    // 3. Helper to draw circular avatars
    const drawAvatar = async (url, x) => {
        const img = await loadImage(url);
        ctx.save();
        ctx.beginPath();
        ctx.arc(x + 60, 125, 60, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = 6;
        ctx.stroke();
        ctx.clip();
        ctx.drawImage(img, x, 65, 120, 120);
        ctx.restore();
    };

    await drawAvatar(donatorImage, 50); // Donator
    await drawAvatar(raiserImage, 630); // Raiser

    // 4. Draw Text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${donatorUsername} donated ${amount} to ${raiserUsername}!`, 400, 130);

    // 5. Send to Discord
    const buffer = canvas.toBuffer('image/png');
    try {
        await axios.post(DISCORD_WEBHOOK, {
            content: "New Donation!",
            embeds: [{
                image: { url: "attachment://donation.png" }
            }]
        }, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Note: For full multipart/form-data support, use 'form-data' library
        res.status(200).send("Success");
    } catch (e) {
        res.status(500).send("Error");
    }
});

app.listen(process.env.PORT || 3000);
