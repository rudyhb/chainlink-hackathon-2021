ScalableRNG is a smart contract that uses ChainLink Keepers.

ChainLink Keepers routinely call ChainLink VRF and maintain a master random seed. Individual dApps can commit to using the next master random seed and just have to wait until the next Keepers upkeep (~30 seconds in my App).

This allows dApps to use a good source of randomness without having to hold LINK or use ChainLink VRF.
