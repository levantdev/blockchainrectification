/**
 * The object for `web3.abi`
 */
declare const _default: {
    encodeEventSignature: (functionName: string | import("web3-types").AbiEventFragment) => string;
    encodeFunctionCall: (jsonInterface: import("web3-types").AbiFunctionFragment, params: unknown[]) => string;
    encodeFunctionSignature: (functionName: string | import("web3-types").AbiFunctionFragment) => string;
    encodeParameter: (abi: import("web3-types").AbiInput, param: unknown) => string;
    encodeParameters: (abi: readonly import("web3-types").AbiInput[], params: unknown[]) => string;
    decodeParameter: (abi: import("web3-types").AbiInput, bytes: string) => unknown;
    decodeParameters: (abi: import("web3-types").AbiInput[], bytes: string) => {
        [key: string]: unknown;
        __length__: number;
    };
    decodeLog: <ReturnType_1 extends import("web3-types").DecodedParams>(inputs: import("web3-types").AbiParameter[], data: string, topics: string | string[]) => ReturnType_1;
};
export default _default;
//# sourceMappingURL=abi.d.ts.map