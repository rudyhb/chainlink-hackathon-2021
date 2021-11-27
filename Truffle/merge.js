const fs = require('fs');
const { merge } = require('sol-merger');

const license = "// SPDX-License-Identifier: MIT";

const run = async () => {
    // Get the merged code as a string
    let mergedCode = await merge("./contracts/ScalableRng.sol");
    // Remove licenses and add new one
    mergedCode = mergedCode.replace(/\/\/\s+SPDX\-License\-Identifier:\s+[^\n]+\n/ig, '');
    // Print it out or write it to a file etc.
    fs.writeFileSync('./deployedContracts/singleFileScalableRng.sol', license + '\n' + mergedCode);
}

run().then(() => {
    console.log('merged!')
})
.catch(e => {
    console.error(e)
})