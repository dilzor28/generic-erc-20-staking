const GenericERC20=artifacts.require ("./GenericERC20.sol");
const GenericERC20Stake=artifacts.require ("./GenericERC20Stake.sol");

module.exports = function(deployer) {
    // Test for the staking contract
    deployer.deploy(GenericERC20, 50000000).then((instance) => {
        tokenInstance = instance;
        return deployer.deploy(GenericERC20Stake, GenericERC20.address).then(() => {
            tokenInstance.addToWhitelist(GenericERC20Stake.address);
            tokenInstance.unlock(); // remove after publishing to the blockchain
        });
    });
}