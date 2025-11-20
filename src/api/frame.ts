import { NextApiRequest, NextApiResponse } from 'next';
import { ThirdwebEngine } from 'thirdweb-engine';
import { ethers } from 'ethers';

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

// Define the logic for the Farcaster Frame API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { castId, frameActionBody } = req.body;

        // Verify the message (optional, but highly recommended)
        // You would typically verify the Farcaster Frame message signature here using NEYNAR_API_KEY
        // For simplicity, we skip full verification but ensure required fields are present.

        if (!frameActionBody || !frameActionBody.fid) {
            return res.status(400).json({ error: 'Invalid Farcaster Frame Action' });
        }

        const userAddress = frameActionBody.address || '0x...'; // Address derived from frameActionBody.fid

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
        res.setHeader('Content-Type', 'text/html');
        res.status(200).send(`
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
        `);
    } catch (error) {
        console.error('Frame Error:', error);
        res.status(500).send(`
            <!DOCTYPE html>
            <html>
            <head>
                <meta property="fc:frame" content="vNext" />
                <meta property="fc:frame:image" content="${config.thirdweb.vercelUrl}/error.png" />
                <meta property="fc:frame:post_url" content="${config.thirdweb.vercelUrl}/api/frame" />
                <meta property="fc:frame:button:1" content="Try Again" />
            </head>
            </html>
        `);
    }
}
