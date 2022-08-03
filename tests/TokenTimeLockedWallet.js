const chai = require('chai');
const chaiAsPromise = require('chai-as-promised');
const { BigNumber } = require('ethers');

chai.use(chaiAsPromise);
const expect = chai.expect;
const provider = ethers.provider;
const days = 24 * 3600;
const ZeroAmt = ethers.constants.Zero;

async function adjustTime(duration) {
    ethers.provider.send("evm_increaseTime", [duration]);
    ethers.provider.send("evm_mine", []);
}

function array_range(start, end) {
    return Array(end - start + 1).fill().map((_, idx) => start + idx)
}

describe('TokenTimeLockedWallet Contract Testing', () => {
    let creator, owner, user;
    let factory, wallet, token, anotherToken;
    let lockTimeFrames = [];
    let lockAmounts = [];
    let isWithdraw = [];

    before(async() => {
        [creator, owner, user] = await ethers.getSigners();

        const Factory = await ethers.getContractFactory('TimeLockedWalletFactory', creator);
        factory = await Factory.deploy();

        const Token = await ethers.getContractFactory('Token', creator);
        token = await Token.deploy('Morpheus Labs Token', 'MITx');
        anotherToken = await Token.deploy('Another Token', 'AT20');
    });

    it('Should succeed to create a new Wallet', async() => {
        const block = await provider.getBlockNumber();
        const timestamp = (await provider.getBlock(block)).timestamp;
        for (let i = 0; i < 15; i++) {
            lockTimeFrames.push(BigNumber.from(timestamp + 30 * (i + 1) * days));
            lockAmounts.push(BigNumber.from(1000 * (15 - i)));
            isWithdraw.push(false);
        }
        const walletAddr = await factory.connect(creator).callStatic.newTimeLockedWallet(
            owner.address, lockTimeFrames, lockAmounts
        );
        const tx = await factory.connect(creator).newTimeLockedWallet(
            owner.address, lockTimeFrames, lockAmounts
        );
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'Created' });

        expect(event != undefined).true;
        expect(event.args.wallet).deep.equal(walletAddr);
        expect(event.args.from).deep.equal(creator.address);
        expect(event.args.to).deep.equal(owner.address);
        expect(event.args.lockTimeFrames).deep.equal(lockTimeFrames);
        expect(event.args.lockAmounts).deep.equal(lockAmounts);
        
        const wallets = await factory.getWallets(creator.address);
        expect(wallets.length).deep.equals(1)
        expect(wallets[0]).deep.equals(walletAddr)
       
        wallet = await ethers.getContractAt("TokenTimeLockedWallet", walletAddr);
        const info = await wallet.info();
        expect(info[0]).deep.equals(creator.address);
        expect(info[1]).deep.equals(owner.address);
        expect(info[3]).deep.equals(lockTimeFrames);
        expect(info[4]).deep.equals(lockAmounts);
        expect(info[5]).deep.equals(isWithdraw);
    });

    it('Should revert when Owner tries to add new lock', async() => {
        const block = await provider.getBlockNumber();
        const timestamp = (await provider.getBlock(block)).timestamp;
        const lockTimeFrame = BigNumber.from(timestamp + 30 * (15 + 1) * days);
        const lockAmount = BigNumber.from(1000 * 16);

        const old_info = await wallet.info();
        expect(old_info[3].length).deep.equals(15);
        expect(old_info[4].length).deep.equals(15);

        await expect(
            wallet.connect(owner).addNewLock(lockTimeFrame, lockAmount)
        ).to.be.revertedWith('Caller is not creator');

        const new_info = await wallet.info();
        expect(new_info[3].length).deep.equals(15);
        expect(new_info[4].length).deep.equals(15);
    });

    it('Should succeed when Creator add new lock', async() => {
        const block = await provider.getBlockNumber();
        const timestamp = (await provider.getBlock(block)).timestamp;
        const lockTimeFrame = BigNumber.from(timestamp + 30 * (15 + 1) * days);
        const lockAmount = BigNumber.from(1000 * 16);
        
        const old_info = await wallet.info();
        expect(old_info[3].length).deep.equals(15);
        expect(old_info[4].length).deep.equals(15);
        expect(old_info[3]).deep.equals(lockTimeFrames);
        expect(old_info[4]).deep.equals(lockAmounts);

        await wallet.connect(creator).addNewLock(lockTimeFrame, lockAmount);

        lockTimeFrames.push(lockTimeFrame);
        lockAmounts.push(lockAmount);
        const new_info = await wallet.info();
        expect(new_info[3].length).deep.equals(16);
        expect(new_info[4].length).deep.equals(16);
        expect(new_info[3]).deep.equals(lockTimeFrames);
        expect(new_info[4]).deep.equals(lockAmounts);
    });

    it('Should revert when Creator tries to call withdraw token', async() => {
        const totalAmt = lockAmounts.reduce( (a, b) => a.add(b), BigNumber.from(0));
        await token.connect(creator).mint(wallet.address, totalAmt);

        expect(await token.balanceOf(wallet.address)).deep.equals(totalAmt);
        
        await expect(
            wallet.connect(creator).withdrawTokens(token.address)
        ).to.be.revertedWith('Caller is not owner');

        expect(await token.balanceOf(wallet.address)).deep.equals(totalAmt);
    });

    it('Should succeed when Owner calls withdraw token before unlock time, but receive zero amount', async() => {
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        await wallet.connect(owner).withdrawTokens(token.address)

        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet);
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner);
    });

    it('Should succeed when Owner calls withdraw token and passes invalid token address, but receive zero amount', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[0].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[0].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet1 = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        const balWallet2 = await anotherToken.balanceOf(wallet.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(anotherToken.address);
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        expect(info[5][0]).deep.equals(false);          //  make sure `isWithdraw` = false
        expect(event != undefined).false;               //  make sure no event throwing
        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet1);
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner);
        expect(await anotherToken.balanceOf(wallet.address)).deep.equals(balWallet2);
    });

    it('Should succeed when Owner calls withdraw token - Unlock 0', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[0].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[0].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        expect(info[5][0]).deep.equals(true);          //  make sure `isWithdraw` = true
        expect(event != undefined).true;     
        expect(event.args.tokenContract).deep.equal(token.address);
        expect(event.args.to).deep.equal(owner.address);
        expect(event.args.amount).deep.equal(lockAmounts[0]); 

        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet.sub(lockAmounts[0]));
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner.add(lockAmounts[0]));
    });

    it('Should succeed when Owner calls withdraw token - Unlock 1+2+3', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[3].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[3].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const events = txReceipt.events.filter(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        let totalAmt = 0;
        array_range(1, 3).map(i => {
            expect(info[5][i]).deep.equals(true)            //  make sure `isWithdraw` = true
            expect(events[i - 1].args.tokenContract).deep.equal(token.address);
            expect(events[i - 1].args.to).deep.equal(owner.address);
            expect(events[i - 1].args.amount).deep.equal(lockAmounts[i]); 
            totalAmt = lockAmounts[i].add(totalAmt);
        });
        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet.sub(totalAmt));
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner.add(totalAmt));
    });

    it('Should succeed when Owner calls withdraw token - Unlock 4', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[4].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[4].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        expect(info[5][4]).deep.equals(true);          //  make sure `isWithdraw` = true
        expect(event != undefined).true;     
        expect(event.args.tokenContract).deep.equal(token.address);
        expect(event.args.to).deep.equal(owner.address);
        expect(event.args.amount).deep.equal(lockAmounts[4]); 

        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet.sub(lockAmounts[4]));
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner.add(lockAmounts[4]));
    });

    it('Should succeed when Owner calls withdraw token - Unlock 5', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[5].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[5].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        expect(info[5][5]).deep.equals(true);          //  make sure `isWithdraw` = true
        expect(event != undefined).true;     
        expect(event.args.tokenContract).deep.equal(token.address);
        expect(event.args.to).deep.equal(owner.address);
        expect(event.args.amount).deep.equal(lockAmounts[5]); 

        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet.sub(lockAmounts[5]));
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner.add(lockAmounts[5]));
    });

    it('Should succeed when Owner calls withdraw token - Unlock 6->15', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[15].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[15].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const events = txReceipt.events.filter(e => { return e.event == 'WithdrewTokens' });

        const info = await wallet.info();
        let totalAmt = 0;   const max = 15;
        array_range(6, 15).map(i => {
            expect(info[5][i]).deep.equals(true)            //  make sure `isWithdraw` = true
            expect(events[i - 6].args.tokenContract).deep.equal(token.address);
            expect(events[i - 6].args.to).deep.equal(owner.address);
            expect(events[i - 6].args.amount).deep.equal(lockAmounts[i]); 
            totalAmt = lockAmounts[i].add(totalAmt);
        });
        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet.sub(totalAmt));
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner.add(totalAmt));
    });

    it('Should succeed when Owner calls withdraw token after completely claimed - Balance remains unchanged', async() => {
        let block = await provider.getBlockNumber();
        let timestamp = (await provider.getBlock(block)).timestamp;
        if (lockTimeFrames[15].gt(timestamp)) {
            const adjustAmt = lockTimeFrames[15].sub(timestamp);
            await adjustTime(adjustAmt.toNumber());
        }
            
        const balWallet = await token.balanceOf(wallet.address);
        const balOwner = await token.balanceOf(owner.address);
        
        const tx = await wallet.connect(owner).withdrawTokens(token.address);
        const txReceipt = await tx.wait();
        const event = txReceipt.events.find(e => { return e.event == 'WithdrewTokens' });

        expect(event != undefined).false;               //  no event throwing
        expect(await token.balanceOf(wallet.address)).deep.equals(balWallet);
        expect(await token.balanceOf(owner.address)).deep.equals(balOwner);

        const info = await wallet.info();
        const isWithdraw = lockTimeFrames.map( _ => true);
        expect(info[5]).deep.equals(isWithdraw);          //  make sure `isWithdraw` = true for all

        const totalAmt = lockAmounts.reduce( (a, b) => a.add(b), BigNumber.from(0));
        expect(await token.balanceOf(wallet.address)).deep.equals(ZeroAmt);
        expect(await token.balanceOf(owner.address)).deep.equals(totalAmt);
    });
});