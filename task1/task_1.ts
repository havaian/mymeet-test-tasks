import * as puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';

interface ScrapedData {
    texts: string[];
    images: string[];
}

async function downloadImage(url: string, outputPath: string): Promise<void> {
    try {
        const response = await axios({
            url,
            responseType: 'stream',
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        
        const writer = fs.createWriteStream(outputPath);
        response.data.pipe(writer);
        
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading image from ${url}:`, error);
    }
}

async function randomDelay(min: number, max: number): Promise<void> {
    const delay = Math.floor(Math.random() * (max - min + 1) + min);
    await new Promise(resolve => setTimeout(resolve, delay));
}

async function scrapeWebsite(url: string): Promise<ScrapedData> {
    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-web-security',
            '--disable-features=IsolateOrigins,site-per-process',
            '--window-size=1920x1080'
        ]
    });

    try {
        const page = await browser.newPage();
        
        // Block unnecessary resources
        await page.setRequestInterception(true);
        page.on('request', (request) => {
            const resourceType = request.resourceType();
            if (['stylesheet', 'font', 'image', 'media'].includes(resourceType)) {
                request.abort();
            } else {
                request.continue();
            }
        });

        // Set browser-like properties
        await page.setViewport({ width: 1920, height: 1080 });
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
        await page.setExtraHTTPHeaders({
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
        });

        // Set longer timeout
        await page.setDefaultNavigationTimeout(120000);
        
        console.log(`Navigating to ${url}...`);
        const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 120000
        });
        
        if (!response) {
            throw new Error('Failed to load the page');
        }

        // Add random delay to mimic human behavior
        await randomDelay(2000, 5000);
        
        console.log('Page loaded, extracting text...');
        const texts = await page.evaluate(() => {
            const textNodes = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
            return Array.from(textNodes)
                .map(node => node.textContent?.trim())
                .filter((text): text is string => text !== null && text !== undefined && text.length > 0);
        });

        await randomDelay(1000, 3000);

        console.log('Extracting images...');
        const images = await page.evaluate(() => {
            const imgNodes = document.querySelectorAll('img');
            return Array.from(imgNodes)
                .map(img => img.getAttribute('src'))
                .filter((src): src is string => src !== null && src !== undefined && src.startsWith('http'));
        });

        console.log(`Found ${texts.length} text elements and ${images.length} images`);
        return { texts, images };
    } catch (error) {
        console.error('Error during scraping:', error);
        throw error;
    } finally {
        await browser.close();
    }
}

async function main() {
    let retries = 3;
    
    while (retries > 0) {
        try {
            const textDir = path.join(__dirname, 'scraped_texts');
            const imageDir = path.join(__dirname, 'scraped_images');
            
            fs.mkdirSync(textDir, { recursive: true });
            fs.mkdirSync(imageDir, { recursive: true });

            console.log(`Starting web scraping (${retries} attempts remaining)...`);
            const scrapedData = await scrapeWebsite('https://mymeet.ai');

            console.log('Writing text content...');
            const textContent = scrapedData.texts.join('\n\n');
            fs.writeFileSync(
                path.join(textDir, 'content.txt'),
                textContent,
                'utf-8'
            );

            console.log('Downloading images...');
            for (const [index, imageUrl] of Object.entries(scrapedData.images)) {
                const extension = path.extname(imageUrl) || '.jpg';
                const imagePath = path.join(imageDir, `image_${index}${extension}`);
                await downloadImage(imageUrl, imagePath);
                console.log(`Downloaded image ${parseInt(index) + 1}/${scrapedData.images.length}`);
            }

            console.log('Task 1 completed successfully!');
            console.log(`Texts saved to: ${textDir}`);
            console.log(`Images saved to: ${imageDir}`);
            break;

        } catch (error) {
            console.error(`Attempt failed (${retries} remaining):`, error);
            retries--;
            
            if (retries > 0) {
                console.log('Waiting before retry...');
                await randomDelay(5000, 10000);
            } else {
                console.error('All attempts failed');
                process.exit(1);
            }
        }
    }
}

main();