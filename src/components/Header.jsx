'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import React from 'react';

export default function Header() {
    return (
        <div>
            <div className="shadow-sm border-b sticky top-0 bg-white z-30 p-3">
                <div className="border hover:border-slate-900 rounded">
                    <WalletMultiButton />
                </div>
            </div>
        </div>
    );
}
