import { ThirdwebEngine } from 'thirdweb-engine';
const ethers = require('ethers'); // استفاده از require برای رفع مشکلات نوع‌دهی و سازگاری

// Import the config from your project
import { config } from '../../config/config';

// Initialize thirdweb Engine
const engine = new ThirdwebEngine({
    url: config.engine.url,
    accessToken: config.engine.accessToken,
    wallet: config.engine.wallet,
});

// Address of the NFT contract
const contractAddress = config.contractAddress;
const chainId = config.thirdweb.chainId;

// Define the logic for the Farcaster Frame API using the required POST method for Next.js 14
export async function POST(req: Request) {
    
    // تابع GET برای جلوگیری از خطا در مرورگر
    if (req.method !== 'POST') {
        return new Response("Method Not Allowed. Please send a POST request.", { status: 405 });
    }

    try {
        // خواندن بدنه درخواست JSON (روش استاندارد در route.ts)
        const body = await req.json();
        const { frameActionBody } = body;

        if (!frameActionBody || !frameActionBody.fid) {
            return new Response(JSON.stringify({ error: 'Invalid Farcaster Frame Action' }), { status: 400 });
        }

        // در این مرحله، ما آدرس کیف پول کاربر را از frameActionBody می‌گیریم
        const userAddress = frameActionBody.address || '0x...'; 

        // 1. Prepare the transaction using thirdweb Engine
        const tx = await engine.erc721.claim.prepare({
            chain: chainId,
            contractAddress: contractAddress,
            to: userAddress,
            quantity: 1, // Minting 1 NFT
        });

        // 2. Send the transaction using thirdweb Engine
        const result = await engine.transactions.send({
            tx: tx,
        });

        // Respond with a success image or final frame state
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="${config.thirdweb.vercelUrl}/success.png" />
                <meta property="fc:frame:post_url" content="${config.thirdweb.vercelUrl}/api/frame" />
                <meta property="fc:frame:button:1" content="View on Etherscan" />
                <meta property="fc:frame:button:1:action" content="link" />
                <meta property="fc:frame:button:1:target" content="https://basescan.org/tx/${result.transactionHash}" />
            </head>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
            status: 200
        });

    } catch (error) {
        console.error('Frame Error:', error);

        // Respond with an error frame
        return new Response(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="${config.thirdweb.vercelUrl}/error.png" />
                <meta property="fc:frame:post_url" content="${config.thirdweb.vercelUrl}/api/frame" />
                <meta property="fc:frame:button:1" content="Try Again" />
            </head>
            </html>
        `, {
            headers: { 'Content-Type': 'text/html' },
            status: 500
        });
    }
}


// لازم است تابع GET نیز تعریف شود تا Next.js Build خطا ندهد
export async function GET() {
    return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta property="fc:frame" content="vNext" />
            <meta property="fc:frame:image" content="${config.thirdweb.vercelUrl}/frame-image.png" />
            <meta property="fc:frame:post_url" content="${config.thirdweb.vercelUrl}/api/frame" />
            <meta property="fc:frame:button:1" content="Mint Your NFT" />
        </head>
        </html>
    `, {
        headers: { 'Content-Type': 'text/html' },
        status: 200
    });
}
