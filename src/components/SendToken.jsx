'use client';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback, useState } from 'react';
import { WalletNotConnectedError } from '@solana/wallet-adapter-base';
import {
    getAssociatedTokenAddress,
    createTransferInstruction,
    TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import LoadingButton from './LoadingButton';

export default function SendToken() {
    const { publicKey, sendTransaction } = useWallet();
    const [transferBalance, setTransferBalance] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [destinationWallet, setDestination] = useState(null);
    const connection = new Connection(process.env.RPC_URL);
    const MINT_ADDRESS = process.env.MINT_ADDRESS;

    const sendTokens = useCallback(async () => {
        if (!publicKey) throw new WalletNotConnectedError();

        setIsLoading(true);

        //step1 get source account
        let sourceAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        //step2 get destination account
        let destinationAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            new PublicKey(destinationWallet),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        //step3 fetch token decimal
        const numberDecimals = await getNumberDecimals(MINT_ADDRESS);

        //step4 create transaction
        console.log({
            source: sourceAccount.toString(),
            dest: destinationAccount.toString(),
        });
        const transaction = new Transaction().add(
            createTransferInstruction(
                sourceAccount,
                destinationAccount,
                publicKey,
                transferBalance * Math.pow(10, numberDecimals),
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        //step5 get last block hash
        const {
            context: { slot: minContextSlot },
            value: { blockhash, lastValidBlockHeight },
        } = await connection.getLatestBlockhashAndContext();

        //step6 send and confirm transaction
        const signature = await sendTransaction(transaction, connection, {
            minContextSlot,
        });
        await connection.confirmTransaction({
            blockhash,
            lastValidBlockHeight,
            signature,
        });

        console.log(signature);
        clearData();
    }, [publicKey, sendTransaction, connection]);

    const getNumberDecimals = async () => {
        const info = await connection.getParsedAccountInfo(
            new PublicKey(MINT_ADDRESS)
        );
        const result = (info.value?.data).parsed.info.decimals;
        return result;
    };

    const onChangeDestionation = (event) => setDestination(event.target.value);
    const onChangeTransferBalance = (event) =>
        setTransferBalance(event.target.value);
    const isButtonDisabled = destinationWallet == null || transferBalance <= 0;
    const clearData = () => {
        setDestination(null);
        setTransferBalance(0);
        setIsLoading(false);
    };

    return (
        <form>
            <div class="grid gap-6 mb-6 md:grid-cols-2">
                <div>
                    <label
                        for="destination_wallet"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Destination Wallet
                    </label>
                    <input
                        type="text"
                        id="destination_wallet"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder=""
                        required
                        onChange={(e) => onChangeDestionation(e)}
                    />
                </div>
                <div>
                    <label
                        for="last_name"
                        class="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                    >
                        Token Amount
                    </label>
                    <input
                        type="number"
                        id="visitors"
                        class="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                        placeholder=""
                        required
                        onChange={(e) => onChangeTransferBalance(e)}
                    />
                </div>
            </div>
            <LoadingButton isLoading={isLoading}>
                {' '}
                <button
                    disabled={isButtonDisabled}
                    onClick={sendTokens}
                    class="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm w-full sm:w-auto px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                >
                    Send
                </button>
            </LoadingButton>
        </form>
    );
}
