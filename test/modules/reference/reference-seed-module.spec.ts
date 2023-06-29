import '@nomiclabs/hardhat-ethers';
import { expect } from 'chai';
import { ZERO_ADDRESS } from '../../helpers/constants';
import { getTimestamp, matchEvent, waitForTx } from '../../helpers/utils';
import {
  freeCollectModule,
  FIRST_PROFILE_ID,
  referenceSeedModule,
  governance,
  lensHub,
  currency,
  makeSuiteCleanRoom,
  MOCK_FOLLOW_NFT_URI,
  MOCK_PROFILE_HANDLE,
  MOCK_PROFILE_URI,
  MOCK_URI,
  SEED_PAYMENT_AMOUNT,
  user,
  userAddress,
  userThreeAddress,
  userTwo,
  userTwoAddress,
  abiCoder,
  relayer,
} from '../../__setup.spec';

makeSuiteCleanRoom('Seed Module', function () {
  const SECOND_PROFILE_ID = FIRST_PROFILE_ID + 1;

  beforeEach(async function () {
    await expect(
      lensHub.createProfile({
        to: userAddress,
        handle: MOCK_PROFILE_HANDLE,
        imageURI: MOCK_PROFILE_URI,
        followModule: ZERO_ADDRESS,
        followModuleInitData: [],
        followNFTURI: MOCK_FOLLOW_NFT_URI,
      })
    ).to.not.be.reverted;
    await expect(
      lensHub.createProfile({
        to: userTwoAddress,
        handle: 'user2',
        imageURI: MOCK_PROFILE_URI,
        followModule: ZERO_ADDRESS,
        followModuleInitData: [],
        followNFTURI: MOCK_FOLLOW_NFT_URI,
      })
    ).to.not.be.reverted;
    await expect(
      lensHub.connect(governance).whitelistReferenceModule(referenceSeedModule.address, true)
    ).to.not.be.reverted;
    await expect(
      lensHub.connect(governance).whitelistCollectModule(freeCollectModule.address, true)
    ).to.not.be.reverted;
    await expect(
      lensHub.post({
        profileId: FIRST_PROFILE_ID,
        contentURI: MOCK_URI,
        collectModule: freeCollectModule.address,
        collectModuleInitData: abiCoder.encode(['bool'], [true]),
        referenceModule: referenceSeedModule.address,
        referenceModuleInitData: [],
      })
    ).to.not.be.reverted;
  });

  context('Scenarios', function () {
    context('Publishing', function () {
      it('Posting with seed module as reference module should emit expected events', async function () {
        const tx = lensHub.post({
          profileId: FIRST_PROFILE_ID,
          contentURI: MOCK_URI,
          collectModule: freeCollectModule.address,
          collectModuleInitData: abiCoder.encode(['bool'], [true]),
          referenceModule: referenceSeedModule.address,
          referenceModuleInitData: [],
        });
        const receipt = await waitForTx(tx);

        expect(receipt.logs.length).to.eq(1);
        matchEvent(receipt, 'PostCreated', [
          FIRST_PROFILE_ID,
          2,
          MOCK_URI,
          freeCollectModule.address,
          abiCoder.encode(['bool'], [true]),
          referenceSeedModule.address,
          [],
          await getTimestamp(),
        ]);
      });
    });

    context('Commenting', function () {
      it('Commenting should not work if not pay token', async function () {
        await expect(
          lensHub.comment({
            profileId: SECOND_PROFILE_ID,
            contentURI: MOCK_URI,
            profileIdPointed: FIRST_PROFILE_ID,
            pubIdPointed: 1,
            referenceModuleData: [],
            collectModule: freeCollectModule.address,
            collectModuleInitData: abiCoder.encode(['bool'], [true]),
            referenceModule: referenceSeedModule.address,
            referenceModuleInitData: [],
          })
        ).to.be.reverted;
      });

      it('Commenting should not work if pay not enough token', async function () {
        await expect(currency.mint(userTwoAddress, SEED_PAYMENT_AMOUNT - 1)).to.not.be.reverted;
        await expect(
          currency.connect(userTwo).approve(referenceSeedModule.address, SEED_PAYMENT_AMOUNT)
        ).to.not.be.reverted;

        await expect(
          lensHub.comment({
            profileId: SECOND_PROFILE_ID,
            contentURI: MOCK_URI,
            profileIdPointed: FIRST_PROFILE_ID,
            pubIdPointed: 1,
            referenceModuleData: [],
            collectModule: freeCollectModule.address,
            collectModuleInitData: abiCoder.encode(['bool'], [true]),
            referenceModule: referenceSeedModule.address,
            referenceModuleInitData: [],
          })
        ).to.be.reverted;
      });

      it('Commenting should work if pay token', async function () {
        await expect(currency.mint(userTwoAddress, SEED_PAYMENT_AMOUNT * 2)).to.not.be.reverted;
        await expect(
          currency.connect(userTwo).approve(referenceSeedModule.address, SEED_PAYMENT_AMOUNT)
        ).to.not.be.reverted;

        await expect(
          lensHub.connect(userTwo).comment({
            profileId: SECOND_PROFILE_ID,
            contentURI: MOCK_URI,
            profileIdPointed: FIRST_PROFILE_ID,
            pubIdPointed: 1,
            referenceModuleData: [],
            collectModule: freeCollectModule.address,
            collectModuleInitData: abiCoder.encode(['bool'], [true]),
            referenceModule: referenceSeedModule.address,
            referenceModuleInitData: [],
          })
        ).to.be.not.reverted;

        expect((await currency.balanceOf(userTwoAddress)).toNumber()).to.be.eq(SEED_PAYMENT_AMOUNT);
        expect((await currency.balanceOf(referenceSeedModule.address)).toNumber()).to.be.eq(
          SEED_PAYMENT_AMOUNT
        );
      });

      it('Commenting should work if pay token by comment creator self', async function () {
        await expect(currency.mint(userAddress, SEED_PAYMENT_AMOUNT)).to.not.be.reverted;
        await expect(
          currency.connect(user).approve(referenceSeedModule.address, SEED_PAYMENT_AMOUNT)
        ).to.not.be.reverted;

        await expect(
          lensHub.comment({
            profileId: FIRST_PROFILE_ID,
            contentURI: MOCK_URI,
            profileIdPointed: FIRST_PROFILE_ID,
            pubIdPointed: 1,
            referenceModuleData: [],
            collectModule: freeCollectModule.address,
            collectModuleInitData: abiCoder.encode(['bool'], [true]),
            referenceModule: referenceSeedModule.address,
            referenceModuleInitData: [],
          })
        ).to.be.not.reverted;
      });

      it('Commenting should emit CommentCreated events', async function () {
        await expect(currency.mint(userTwoAddress, SEED_PAYMENT_AMOUNT)).to.not.be.reverted;
        await expect(
          currency.connect(userTwo).approve(referenceSeedModule.address, SEED_PAYMENT_AMOUNT)
        ).to.not.be.reverted;

        const tx = lensHub.connect(userTwo).comment({
          profileId: SECOND_PROFILE_ID,
          contentURI: MOCK_URI,
          profileIdPointed: FIRST_PROFILE_ID,
          pubIdPointed: 1,
          referenceModuleData: [],
          collectModule: freeCollectModule.address,
          collectModuleInitData: abiCoder.encode(['bool'], [true]),
          referenceModule: referenceSeedModule.address,
          referenceModuleInitData: abiCoder.encode(['address'], [userThreeAddress]),
        });

        const receipt = await waitForTx(tx);

        expect(receipt.logs.length).to.eq(3);

        matchEvent(receipt, 'CommentCreated', [
          SECOND_PROFILE_ID,
          1,
          MOCK_URI,
          FIRST_PROFILE_ID,
          1,
          [],
          freeCollectModule.address,
          abiCoder.encode(['bool'], [true]),
          referenceSeedModule.address,
          abiCoder.encode(['address'], [userThreeAddress]), // pass payer address in data
          await getTimestamp(),
        ]);
      });
    });

    context('PushReward', function () {
      it('Relayer can add reward', async function () {
        await expect(currency.mint(referenceSeedModule.address, 100)).to.not.be.reverted;

        const user1Reward = {
          sun: 100,
          rain: 80,
          soil: 30,
        };

        const receipt = await waitForTx(
          referenceSeedModule
            .connect(relayer)
            .addSeedRewards([FIRST_PROFILE_ID], [user1Reward], [1])
        );

        matchEvent(
          receipt,
          'AddSeedReward',
          [
            FIRST_PROFILE_ID,
            1,
            user1Reward.sun,
            user1Reward.rain,
            user1Reward.soil,
            await getTimestamp(),
          ],
          referenceSeedModule
        );
      });

      it('User can claim reward', async function () {
        await expect(currency.mint(referenceSeedModule.address, 100)).to.not.be.reverted;

        const user1Reward = {
          sun: 100,
          rain: 80,
          soil: 30,
        };

        await expect(
          referenceSeedModule
            .connect(relayer)
            .addSeedRewards([FIRST_PROFILE_ID], [user1Reward], [1])
        ).to.be.not.reverted;

        // view reward
        const rewardedOfUser1 = await referenceSeedModule.getReward(FIRST_PROFILE_ID);
        expect(rewardedOfUser1.sun).to.eq(user1Reward.sun);

        await expect(referenceSeedModule.connect(user).claim(FIRST_PROFILE_ID, 100)).to.be.reverted;

        await expect(
          referenceSeedModule.connect(user).claim(FIRST_PROFILE_ID, 30)
        ).to.be.not.reverted;

        const rewardedOfUser1AfterClaim = await referenceSeedModule.getReward(FIRST_PROFILE_ID);
        expect(rewardedOfUser1AfterClaim.sun).to.eq(user1Reward.sun - 30);
        expect(rewardedOfUser1AfterClaim.rain).to.eq(user1Reward.rain - 30);
        expect(rewardedOfUser1AfterClaim.soil).to.eq(user1Reward.soil - 30);

        const contractBalance = await currency.balanceOf(referenceSeedModule.address);
        expect(contractBalance).to.eq(100 - 30);

        const userBalance = await currency.balanceOf(userAddress);
        expect(userBalance).to.eq(30);
      });
    });
  });
});
