const fse = require('fs-extra')
const fs = require('fs')
const path = require('path')

async function main() {
    await clean();
}

async function clean() {
    let dirs = [
        path.resolve(__dirname, '../web-ext-artifacts'),
        path.resolve(__dirname, '../build'),
        path.resolve(__dirname, '../dist'),
    ];
    for (let dir of dirs) {
        console.log(`Removing ${dir}`);
        await fse.remove(dir);
    }
}

if (typeof require !== 'undefined' && require.main === module) {
    return main();
}
