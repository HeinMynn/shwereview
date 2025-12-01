const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const envPath = path.resolve(process.cwd(), '.env.local');
let MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI && fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
            const key = parts[0].trim();
            const value = parts.slice(1).join('=').trim();
            if (key === 'MONGODB_URI') {
                MONGODB_URI = value;
            }
        }
    });
}

// Define minimal schema inline to avoid import issues
const HomepageConfigSchema = new mongoose.Schema({
    cta: {
        title: String,
        subtitle: String,
        buttonText: String,
        link: String
    }
}, { timestamps: true, strict: false });

const HomepageConfig = mongoose.models.HomepageConfig || mongoose.model('HomepageConfig', HomepageConfigSchema);

async function verifyHomepageConfig() {
    try {
        if (!MONGODB_URI) {
            throw new Error('MONGODB_URI not found in .env.local');
        }
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        // 1. Create or Update Config with a Link
        const testLink = '/test-link-' + Date.now();
        const configData = {
            cta: {
                title: 'Test Title',
                subtitle: 'Test Subtitle',
                buttonText: 'Test Button',
                link: testLink
            }
        };

        // Note: We need to be careful not to overwrite other fields if we want to be nice, 
        // but for verification we just want to see if the field saves.
        // Let's fetch first.
        let config = await HomepageConfig.findOne().sort({ createdAt: -1 });

        if (config) {
            // Update specific fields
            config.cta.link = testLink;
            await config.save();
        } else {
            config = await HomepageConfig.create(configData);
        }

        console.log('Saved Config CTA Link:', config.cta.link);

        // 2. Verify it was saved
        const savedConfig = await HomepageConfig.findById(config._id);
        if (savedConfig.cta.link === testLink) {
            console.log('SUCCESS: CTA Link saved correctly.');
        } else {
            console.error('FAILURE: CTA Link mismatch.', savedConfig.cta.link, '!=', testLink);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

verifyHomepageConfig();
