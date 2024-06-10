/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID,
        PAYPAL_DEPOSIT_DESCRIPTION: process.env.PAYPAL_DEPOSIT_DESCRIPTION,
        TOKEN_WALLET_ADDRESS: process.env.TOKEN_WALLET_ADDRESS,
        MINT_ADDRESS: process.env.MINT_ADDRESS,
        RPC_URL: process.env.RPC_URL,
        MINT_SECRET: process.env.MINT_SECRET,
    },
};

export default nextConfig;
