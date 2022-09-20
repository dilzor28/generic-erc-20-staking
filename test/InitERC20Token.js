const { assert } = require("chai");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const GenericERC20 = artifacts.require("./GenericERC20.sol");

contract('GenericERC20', accounts => {
    let tokenInstance;
    const admin = accounts[0];
    const user = accounts[1];
    const user2 = accounts[2];

    it('initialized contract with correct values', () => {
        return GenericERC20.deployed().then(instance => {
            tokenInstance = instance;
            return tokenInstance.name();
        }).then(name => {
            assert.equal(name, 'Generic ERC20', 'has correct name');
            return tokenInstance.symbol();
        }).then(symbol => {
            assert.equal(symbol, 'GE20', 'has correct symbol');
        })
    })

    it('allocate total supply upon deployment', () => {
        return GenericERC20.deployed().then(instance => {
            tokenInstance = instance;
            return tokenInstance.totalSupply();
        }).then(totalSupply => {
            assert.equal(totalSupply.toString(), "50000000000000000000000000", 'sets total supply to 50 mil');
            return tokenInstance.balanceOf(admin);
        }).then(adminBalance => {
            assert.equal(adminBalance.toString(), "50000000000000000000000000", 'allocates inital supply to admin account');
        })
    })

    it('transfers ownership', async () => {
        return GenericERC20.deployed().then(instance => {
            tokenInstance = instance;
            return tokeninstance.transfer.call(user, "99999999950000000000000000000000000", {from: admin});
        }).then(assert.fail).catch(error => {
            assert(error.message, "ERC20: transfer amount exceeds balance");
            return tokenInstance.transfer.call(user, "25000000000000000000000000", { from: admin });
        }).then(success => {
            assert.equal(success, true, 'asserts success is true');
            return tokenInstance.transfer(user, "25000000000000000000000000", { from: admin });
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'only 1 event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'check for transfer event');
            assert.equal(receipt.logs[0].args.from, admin, 'logs from account');
            assert.equal(receipt.logs[0].args.to, user, 'logs to account');
            assert.equal(receipt.logs[0].args.value.toString(), "25000000000000000000000000", 'transfer amount recorded');
            return tokenInstance.balanceOf(user);
        }).then(balance => {
            assert.equal(balance.toString(), "25000000000000000000000000", 'add amount sent to receiving account');
            return tokenInstance.balanceOf(admin);
        }).then(balance => {
            assert.equal(balance.toString(), "25000000000000000000000000", 'deducts amount from sending account');
        })
    })


    // fails

    it('approves tokens for delegated transfer', async () => {
        return GenericERC20.deployed().then(instance => {
            tokenInstance = instance;
            return tokenInstance.approve.call(user, "100");
        }).then(success => {
            assert.equal(success, true, 'allows delegation of token transfer');
            return tokenInstance.approve(user, "100", { from: admin });
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'only 1 event');
            assert.equal(receipt.logs[0].event, 'Approval', 'check for approval event');
            assert.equal(receipt.logs[0].args.owner, admin, 'logs from account');
            assert.equal(receipt.logs[0].args.spender, user, 'logs to account');
            assert.equal(receipt.logs[0].args.value.toString(), "100", 'transfer amount recorded');
            return tokenInstance.allowance(admin, user);
        }).then(allowance => {
            assert.equal(allowance.toString(), 100, 'stores allowed tokens for delegated transfer');
        })
    })

    // succeeds
    it('handle delegated token transfers', () => {
        return GenericERC20.deployed().then(instance => {
            tokenInstance = instance;
            fromAccount = user2;
            toAccount = accounts[3];
            spendingAccount = accounts[4];
            return tokenInstance.transfer(fromAccount, 100, { from: account[0] });
        }).then(receipt => {
            return tokenInstance.approve(spendingAccount, 10, { from: fromAccount });
        }).then(receipt => {
            return tokenInstance.transferFrom.call(fromAccount, toAccount, 5, { from: spendingAccount });
        }).then(success => {
            assert.equal(success, true, 'allows transfer of tokens');
            return tokenInstance.TransferFrom(fromAccount, toAccount, 10, { from: spendingAccount });
        }).then(receipt => {
            assert.equal(receipt.logs.length, 1, 'only 1 event');
            assert.equal(receipt.logs[0].event, 'Transfer', 'check for transfer event');
            assert.equal(receipt.logs[0].args._from, fromAccount, 'logs from account');
            assert.equal(receipt.logs[0].args._to, toAccount, 'logs to account');
            assert.equal(receipt.logs[0].args._value, 5, 'transfer amount recorded');
            return tokenInstance.balanceOf(fromAccount);
        }).then(balance => {
            assert.equal(balance.toString(), 90, 'deducts amount from sender account');
            return tokenInstance.balanceOf(toAccount);
        }).then(balance => {
            assert.equal(balance.toString(), 10, 'adds balance to receiving account');
            return tokenInstance.allowance(fromAccount, spendingAccount);
        }).then(allowance => {
            assert.equal(allowance.toString(), 0, 'deducts amount from allowance');
            return tokenInstance.transferFrom(fromAccount, toAccount, 1000, { from: spendingAccount });
        }).then(assert.fail).catch(error => {
            assert(error.message, 'not enough tokens');
            return tokenInstance.transferFrom(fromAccount, toAccount, 50, { from: spendingAccount });
        }).then(assert.fail).catch(error => {
            assert(error.message, 'not enough allowance');
        })

    })
});
/** This returns all accounts into var accounts
 * web3.eth.getAccounts().then(function(acc){ accounts = acc })
 */