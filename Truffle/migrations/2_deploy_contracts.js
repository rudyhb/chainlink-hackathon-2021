const ScalableRng = artifacts.require("ScalableRng");

module.exports = function(deployer) {
  deployer.deploy(ScalableRng);
};
