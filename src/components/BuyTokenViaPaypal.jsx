'use client';

import { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import LoadingButton from './LoadingButton';
import { useWallet } from '@solana/wallet-adapter-react';
import {
    getAssociatedTokenAddress,
    getOrCreateAssociatedTokenAccount,
    createTransferInstruction,
    TOKEN_2022_PROGRAM_ID,
    createMintToCheckedInstruction,
} from '@solana/spl-token';
import {
    Keypair,
    PublicKey,
    Connection,
    Transaction,
    sendAndConfirmTransaction,
} from '@solana/web3.js';

const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const DESCRIPTION = process.env.PAYPAL_DEPOSIT_DESCRIPTION;
const PAYPAL_FEE = 0.39;
const PAYPAL_FEE_PERCENTAGE = 0.02;

export default function BuyTokenViaPaypal() {
    const [tokenAmount, setTokenAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const { publicKey } = useWallet();

    /* =============================THIS NEED TO MOVE TO SERVER!!!=================================== */
    const MINT_ADDRESS = process.env.MINT_ADDRESS;
    const TOKEN_WALLET_ADDRESS = process.env.TOKEN_WALLET_ADDRESS,
    const connection = new Connection(process.env.RPC_URL);
    const secret = process.env.MINT_SECRET
    const FROM_KEYPAIR = Keypair.fromSecretKey(new Uint8Array(secret));
    const mintToken = async () => {
        console.log('start mint token');

        const tokenAccount = await getOrCreateAssociatedTokenAccount(
            connection,
            FROM_KEYPAIR,
            new PublicKey(MINT_ADDRESS),
            FROM_KEYPAIR.publicKey,
            false,
            null,
            null,
            TOKEN_2022_PROGRAM_ID
        );
        const numberDecimals = await getNumberDecimals();

        const transaction = new Transaction().add(
            createMintToCheckedInstruction(
                new PublicKey(MINT_ADDRESS),
                tokenAccount.address,
                FROM_KEYPAIR.publicKey,
                tokenAmount * Math.pow(10, numberDecimals),
                1,
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        console.log({ transaction, tokenAmount });

        const latestBlockHash = connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = await latestBlockHash.blockhash;

        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [FROM_KEYPAIR]
        );
        console.log('mint token done');
        console.log({ signature, latestBlockHash });
    };

    const sendTokenToUser = async () => {
        console.log('start send token to user');

        //step1 get source account
        const sourceAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            new PublicKey(TOKEN_WALLET_ADDRESS),
            false,
            TOKEN_2022_PROGRAM_ID
        );

        //step2 get destination account
        const destinationAccount = await getAssociatedTokenAddress(
            new PublicKey(MINT_ADDRESS),
            publicKey,
            false,
            TOKEN_2022_PROGRAM_ID
        );

        console.log({
            source: sourceAccount.toString(),
            dest: destinationAccount.toString(),
        });
        //step3 fetch token decimal
        const numberDecimals = await getNumberDecimals();

        //step4 create transaction
        const transaction = new Transaction().add(
            createTransferInstruction(
                sourceAccount,
                destinationAccount,
                FROM_KEYPAIR.publicKey,
                tokenAmount * Math.pow(10, numberDecimals),
                [],
                TOKEN_2022_PROGRAM_ID
            )
        );

        //step5 get last block hash
        const latestBlockHash = await connection.getLatestBlockhash(
            'confirmed'
        );
        transaction.recentBlockhash = await latestBlockHash.blockhash;

        //step6 send and confirm transaction
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [FROM_KEYPAIR]
        );
        console.log('send token done');
        console.log(signature);
    };

    const getNumberDecimals = async () => {
        const info = await connection.getParsedAccountInfo(
            new PublicKey(MINT_ADDRESS)
        );
        const result = (info.value?.data).parsed.info.decimals;
        console.log(result);
        return result;
    };

    /* ========================================================================================== */

    const createOrder = (data, actions) => {
        console.log(data);
        console.log({ tokenAmount, isLoading });
        const paypalFeeByPercentage =
            Number(tokenAmount) * Number(PAYPAL_FEE_PERCENTAGE);
        const totalPaypalFee =
            Number(paypalFeeByPercentage) + Number(PAYPAL_FEE);
        const paypalFeePerItem = (
            Number(totalPaypalFee) / Number(tokenAmount)
        ).toFixed(2);
        const adjustedPaypalFee = (
            Number(paypalFeePerItem) * Number(tokenAmount)
        ).toFixed(2);
        const value = (Number(tokenAmount) + Number(adjustedPaypalFee)).toFixed(
            2
        );
        console.log({
            paypalFeeByPercentage,
            paypalFeePerItem,
            totalPaypalFee,
            value,
        });
        return actions.order.create({
            purchase_units: [
                {
                    description: DESCRIPTION,
                    amount: {
                        currency_code: 'EUR',
                        value,
                        breakdown: {
                            item_total: {
                                currency_code: 'EUR',
                                value: tokenAmount,
                            },
                            tax_total: {
                                currency_code: 'EUR',
                                value: adjustedPaypalFee,
                            },
                        },
                    },
                    items: [
                        {
                            name: 'ALF Token',
                            quantity: tokenAmount,
                            unit_amount: {
                                currency_code: 'EUR',
                                value: '1',
                            },
                            tax: {
                                currency_code: 'EUR',
                                value: paypalFeePerItem,
                            },
                        },
                    ],
                },
            ],
        });
    };

    const mintAndSentToken = async () => {
        setIsLoading(true);

        await mintToken();
        await sendTokenToUser();

        clear();
    };

    const onApprove = async (data, actions) => {
        const order = await actions.order.capture();
        console.log(order);

        await mintAndSentToken();
    };

    const onError = (err) => {
        console.log(err);
        clear();
    };

    const onCancel = async () => {
        console.log('cancel payment');
        clear();
    };

    const onChangeAmount = (e) => {
        setTokenAmount(e.target.value);
        console.log(tokenAmount);
    };

    const isButtonDisabled = tokenAmount <= 0 || !publicKey;
    const clear = () => {
        setTokenAmount(0);
        setIsLoading(false);
    };

    console.log(publicKey);

    return (
        <PayPalScriptProvider
            options={{
                clientId: PAYPAL_CLIENT_ID,
                currency: 'EUR',
                intent: 'capture',
            }}
        >
            <div>
                <div class="mb-5">
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
                        onChange={(e) => onChangeAmount(e)}
                    />
                </div>
                <LoadingButton isLoading={isLoading}>
                    <PayPalButtons
                        style={{
                            color: 'silver',
                            layout: 'horizontal',
                            height: 48,
                            tagline: false,
                            shape: 'pill',
                        }}
                        forceReRender={[tokenAmount]}
                        createOrder={createOrder}
                        onApprove={onApprove}
                        onError={onError}
                        onCancel={onCancel}
                        disabled={isButtonDisabled}
                    />
                </LoadingButton>
            </div>
        </PayPalScriptProvider>
    );
}
