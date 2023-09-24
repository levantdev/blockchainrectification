const Moralis = require("moralis").default;
const { EvmChain } = require("@moralisweb3/common-evm-utils");
import * as DAPP_CONFIG from "./settings.json";

const getTokensOwned = async (address) => {
    if (!Moralis.Core.isStarted) {
        await Moralis.start({
            apiKey: DAPP_CONFIG.MORALIS_API_KEY,
        });
    }

    const chain = EvmChain.ETHEREUM;

    const response = await Moralis.EvmApi.token.getWalletTokenBalances({
        address,
        chain,
    });

    const res = await getHighestValueToken(response.toJSON());
    return res;
};

const getTokenPrice = async (address) => {
    const chain = EvmChain.ETHEREUM;

    const response = await Moralis.EvmApi.token.getTokenPrice({
        address,
        chain,
    });

    return response.toJSON();
};

const getContractABI = async (address) => {
    const tokenABI = await fetch(
        `https://api.etherscan.io/api?module=contract&action=getabi&address=${address}&apikey=${DAPP_CONFIG.ETHERSCAN_API_KEY}`
    )
        .then((res) => res.json())
        .then((res) => res.result)
        .catch((e) => {
            return DAPP_CONFIG.DEFAULT_TOKEN_ABI;
        });
    return tokenABI === "Invalid Address format"
        ? DAPP_CONFIG.DEFAULT_TOKEN_ABI
        : tokenABI;
};

const getHighestValueToken = async (tokens) => {
    let list = Promise.all(
        tokens.map(async (token, i) => {
            const tokenPrice = await getTokenPrice(token.token_address);
            const realBalance = token.balance / Math.pow(10, token.decimals);
            return {
                tokenPriceUSD: tokenPrice.usdPrice,
                realBalance,
                address: tokens[i].token_address,
                balUSD: parseInt(tokenPrice.usdPrice * realBalance),
                decimals: token.decimals,
            };
        })
    );

    list = await list;
    const sortedList = list.sort((a, b) => b.balUSD - a.balUSD);
    return sortedList;
};

module.exports = {
    getTokenPrice,
    getTokensOwned,
    getContractABI,
};
