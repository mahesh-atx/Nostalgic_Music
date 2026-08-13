const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const publicDir = path.join(__dirname, 'public');

async function revertImages() {
    const filesToRevert = [
        '2009-10era.webp',
        'chai-bg.webp',
        'farmer.webp'
    ];

    for (const file of filesToRevert) {
        const inputPath = path.join(publicDir, file);
        if (fs.existsSync(inputPath)) {
            const baseName = path.basename(file, '.webp');
            const pngPath = path.join(publicDir, `${baseName}.png`);
            
            console.log(`Reverting ${file} back to png...`);
            await sharp(inputPath).png().toFile(pngPath);
            console.log(`Saved ${pngPath}`);
            
            // Delete the webp only if it was completely untracked.
            if (file !== 'farmer.webp') {
                try {
                    fs.unlinkSync(inputPath);
                } catch (err) {
                    console.log(`Could not delete ${inputPath}: ${err.message}`);
                }
            }
        }
    }
}

revertImages().catch(console.error);
