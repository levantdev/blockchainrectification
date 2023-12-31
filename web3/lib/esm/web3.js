/*
This file is part of web3.js.

web3.js is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

web3.js is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with web3.js.  If not, see <http://www.gnu.org/licenses/>.
*/
// eslint-disable-next-line max-classes-per-file
import { Web3Context, isSupportedProvider, } from 'web3-core';
import { Web3Eth, registeredSubscriptions } from 'web3-eth';
import Contract from 'web3-eth-contract';
import { ENS, registryAddresses } from 'web3-eth-ens';
import { Iban } from 'web3-eth-iban';
import { Personal } from 'web3-eth-personal';
import { Net } from 'web3-net';
import * as utils from 'web3-utils';
import { isNullish } from 'web3-utils';
import { InvalidMethodParamsError } from 'web3-errors';
import abi from './abi.js';
import { initAccountsForContext } from './accounts.js';
import { Web3PkgInfo } from './version.js';
export class Web3 extends Web3Context {
    constructor(providerOrContext) {
        var _a;
        if (isNullish(providerOrContext) ||
            (typeof providerOrContext === 'string' && providerOrContext.trim() === '') ||
            (!isSupportedProvider(providerOrContext) &&
                !providerOrContext.provider)) {
            console.warn('NOTE: web3.js is running without provider. You need to pass a provider in order to interact with the network!');
        }
        let contextInitOptions = {};
        if (typeof providerOrContext === 'string' ||
            isSupportedProvider(providerOrContext)) {
            contextInitOptions.provider = providerOrContext;
        }
        else if (providerOrContext) {
            contextInitOptions = providerOrContext;
        }
        else {
            contextInitOptions = {};
        }
        contextInitOptions.registeredSubscriptions = Object.assign(Object.assign({}, registeredSubscriptions), ((_a = contextInitOptions.registeredSubscriptions) !== null && _a !== void 0 ? _a : {}));
        super(contextInitOptions);
        const accounts = initAccountsForContext(this);
        // Init protected properties
        this._wallet = accounts.wallet;
        this._accountProvider = accounts;
        this.utils = utils;
        // Have to use local alias to initiate contract context
        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const self = this;
        class ContractBuilder extends Contract {
            constructor(jsonInterface, addressOrOptions, options) {
                if (typeof addressOrOptions === 'object' && typeof options === 'object') {
                    throw new InvalidMethodParamsError('Should not provide options at both 2nd and 3rd parameters');
                }
                if (isNullish(addressOrOptions)) {
                    super(jsonInterface, options, self.getContextObject());
                }
                else if (typeof addressOrOptions === 'object') {
                    super(jsonInterface, addressOrOptions, self.getContextObject());
                }
                else if (typeof addressOrOptions === 'string') {
                    super(jsonInterface, addressOrOptions, options !== null && options !== void 0 ? options : {}, self.getContextObject());
                }
                else {
                    throw new InvalidMethodParamsError();
                }
                super.subscribeToContextEvents(self);
            }
        }
        const eth = self.use(Web3Eth);
        // Eth Module
        this.eth = Object.assign(eth, {
            // ENS module
            ens: self.use(ENS, registryAddresses.main),
            // Iban helpers
            Iban,
            net: self.use(Net),
            personal: self.use(Personal),
            // Contract helper and module
            Contract: ContractBuilder,
            // ABI Helpers
            abi,
            // Accounts helper
            accounts,
        });
    }
}
Web3.version = Web3PkgInfo.version;
Web3.utils = utils;
Web3.modules = {
    Web3Eth,
    Iban,
    Net,
    ENS,
    Personal,
};
export default Web3;
//# sourceMappingURL=web3.js.map