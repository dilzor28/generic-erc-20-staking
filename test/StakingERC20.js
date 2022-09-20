const { assert } = require("chai");
const _deploy_contracts = require("../migrations/2_deploy_contracts");
const GenericERC20Stake = artifacts.require("./GenericERC20Stake.sol");
const GenericERC20 = artifacts.require("./GenericERC20.sol");

contract('GenericERC20Stake', accounts => {
    let stakeInstance;
    let tokenInstance;
    const stakedAmount = "12500000000000000000000000";
    const admin = accounts[0];
    const user = accounts[1];
    const user2 = accounts[2];

    it('try to do some basic staking and unstaking', () => {
        // Initialize contract with user account given tokens to stake
        return GenericERC20Stake.deployed().then(instance => {
            stakeInstance = instance;
            return GenericERC20.deployed().then(instance => {
                tokenInstance = instance;
                tokenInstance.unlock();
                tokenInstance.addToWhitelist(stakeInstance.address);
                return tokenInstance.totalSupply();
            }).then(supply => {
                // Make sure total supply is 50 mil
                assert.equal(supply.toString(), "50000000000000000000000000", 'correct supply');
                return tokenInstance.transfer(user, stakedAmount, { from: admin });
            }).then(receipt => {
                // make sure transfer emits event
                assert.equal(receipt.logs.length, 1, 'only 1 event');
                assert.equal(receipt.logs[0].event, 'Transfer', 'check for transfer event');
                assert.equal(receipt.logs[0].args.from, admin, 'sent from admin account');
                assert.equal(receipt.logs[0].args.to, user, 'sent to user account');
                assert.equal(receipt.logs[0].args.value.toString(), stakedAmount, 'correct transfer amount');
                return tokenInstance.transfer(user2, stakedAmount, { from: admin });
            }).then(receipt => {
                // same as before
                assert.equal(receipt.logs.length, 1, '1 event');
                assert.equal(receipt.logs[0].event, 'Transfer', 'transfer event');
                assert.equal(receipt.logs[0].args.from, admin, 'sent from admin account');
                assert.equal(receipt.logs[0].args.to, user2, 'sent to user2 account');
                assert.equal(receipt.logs[0].args.value.toString(), stakedAmount, 'correct transfer amount');
                return tokenInstance.balanceOf(admin);
            }).then(balance => {
                // make sure admin balance lost the tokens transferred
                assert.equal(balance.toString(), "25000000000000000000000000", 'token taken from admin');
                return stakeInstance.getTotalStakes();
            }).then(stakes => {
                // make sure no stakes exist
                assert.equal(stakes, 0, 'nothing has been staked yet');
                tokenInstance.increaseAllowance(GenericERC20Stake.address, stakedAmount, { from: user });
                return stakeInstance.deposit(stakedAmount, { from: user });
            }).then(receipt => {
                console.log('deposit')
                // check stake of first user
                return stakeInstance.userInfo(user);
            }).then(staked => {
                // make sure staked amount equals what was input
                assert.equal(staked.toString(), "6250000000000000000000000", 'the staked tokens are equal');
                return stakeInstance.getTotalStakes();
            }).then(total => {
                // make sure total staked is accurate
                assert.equal(total.toString(), "6250000000000000000000000", 'the total staked amount is accurate');
                return stakeInstance.withdraw(stakedAmount, { from: user });
            }).then(receipt => {
                // remove staked amount
                return tokenInstance.balanceOf(user);
            }).then(balance => {
                assert.equal(balance.toString(), stakedAmount, 'coin refunded to wallet');
            })
        })
    })
/*
    it('try to break stakes', () => {
        return GenericERC20Stake.deployed().then(instance => {
            stakeInstance = instance;
            return GenericERC20.deployed().then(instance => {
                tokenInstance = instance;
                return stakeInstance.withdraw(1, { from: user });
            }).then(assert.fail).catch(error => {
                // make sure it fails when more is removed than staked
                assert(error.message, 'cannot unstake more than staked');
                return stakeInstance.deposit(12500001, { from: user });
            }).then(assert.fail).catch(error => {
                // ensure no staking over account balance
                assert(error.message, 'cannot stake more than you have');
                return stakeInstance.deposit(-1, { from: user });
            }).then(assert.fail).catch(error => {
                // no staking without owning coin
                assert(error.message, 'cannot stake without coin');
                return stakeInstance.withdraw(-1, { from: user });
            }).then(assert.fail).catch(error => {
                // no staking negatives
                assert(error.message, 'cannot unstake negative amounts');
            })
        })
    });

    it('try to do some advanced staking and unstaking', () => {
        return GenericERC20Stake.deployed().then(instance => {
            stakeInstance = instance;
            return GenericERC20.deployed().then(instance => {
                tokenInstance = instance;
                return tokenInstance.transfer(user, "12500000000000000000000000", { from: admin });
            }).then(receipt => {
                assert.equal(receipt.logs.length, 1, 'only 1 event');
                assert.equal(receipt.logs[0].event, 'Transfer', 'check for transfer event');
                assert.equal(receipt.logs[0].args.from, admin, 'logs from account');
                assert.equal(receipt.logs[0].args.to, user, 'logs to account');
                assert.equal(receipt.logs[0].args.value, "12500000000000000000000000", 'transfer amount recorded');
                return stakeInstance.userInfo(user);
            }).then(userInfo => {
                // check if someone is a stakeholder
                assert.isFalse(userInfo.exists, 'not a stakeholder');
                assert.equal(0, userInfo.amountStaked, 'nothing has been staked yet')
                return tokenInstance.balanceOf(user);
            }).then(balance => {
                tokenInstance.increaseAllowance(GenericERC20Stake.address, "6250000000000000000000000", { from: user });
                return stakeInstance.deposit("6250000000000000000000000", { from: user });
            }).then(res => {
                tokenInstance.increaseAllowance(GenericERC20Stake.address, "6250000000000000000000000", { from: user });
                return stakeInstance.deposit("6250000000000000000000000", { from: user });
            }).then(res => {
                // create some stakeholders
                tokenInstance.increaseAllowance(GenericERC20Stake.address, stakedAmount, { from: user2 });
                return stakeInstance.deposit(stakedAmount, { from: user2 })
            }).then(res => {
                return stakeInstance.withdraw("6250000000000000000000000", { from: user2 })
            }).then(res => {
                return tokenInstance.balanceOf(user2);
            }).then(balance => {
                assert.equal(balance.toString(), "6250000000000000000000000", 'half of total staked was returned');
                return stakeInstance.getTotalStakes();
            }).then(total => {
                assert.equal(total.toString(), "18750000000000000000000000", 'staked amount removed from total');
                tokenInstance.increaseAllowance(GenericERC20Stake.address, "6250000000000000000000000", { from: user2 });
                return stakeInstance.deposit("6250000000000000000000000", { from: user2 });
            }).then(res => {
                return stakeInstance.withdraw(stakedAmount, { from: user2 });
            }).then(res => {
                return stakeInstance.getStakerInfo();
            }).then(res => {
                assert.equal(res[0].length, 1, 'only 1 total staked value returns');
                assert.equal(res[1][0], user, 'only users address returns');
                assert.equal(res[2][0].toString(), stakedAmount, 'staked amount by user is accurate');
            })
        })
    })*/
})