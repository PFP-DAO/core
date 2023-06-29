import { defaultAbiCoder } from 'ethers/lib/utils';
import { task } from 'hardhat/config';
import { LensHub__factory, Currency__factory } from '../typechain-types';
import {
  CommentDataStruct,
  CreateProfileDataStruct,
  PostDataStruct,
} from '../typechain-types/LensHub';
import { getAddrs, initEnv, ProtocolState, waitForTx, ZERO_ADDRESS } from './helpers/utils';
import {
  CONSTANT_CONTENT_URI,
  CONSTANT_REFERENCE_MODULE_DATA,
  CONSTANT_COLLECT_MODULE,
  CONSTANT_COLLECT_MODULE_INIT_DATA,
  CONSTANT_REFERENCE_MODULE,
  CONSTANT_REFERENCE_MODULE_INIT_DATA,
} from './helpers/TreeNode';

task('seed-module', 'tests the ReferenceSeedModule').setAction(async (_, hre) => {
  const [governance, treasury, user, relayer, admin, user2, user3] = await initEnv(hre);
  const addrs = getAddrs();
  const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);
  const currency = Currency__factory.connect(addrs['currency'], governance);
  const seedModuleAddr = addrs['seed module'];

  await waitForTx(lensHub.setState(ProtocolState.Unpaused));

  const createProfileStruct1: CreateProfileDataStruct = {
    to: user.address,
    handle: 'user1',
    imageURI: CONSTANT_CONTENT_URI,
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI: CONSTANT_CONTENT_URI,
  };

  const createProfileStruct2: CreateProfileDataStruct = {
    to: user2.address,
    handle: 'user2',
    imageURI: CONSTANT_CONTENT_URI,
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI: CONSTANT_CONTENT_URI,
  };

  const createProfileStruct3: CreateProfileDataStruct = {
    to: user3.address,
    handle: 'user3',
    imageURI: CONSTANT_CONTENT_URI,
    followModule: ZERO_ADDRESS,
    followModuleInitData: [],
    followNFTURI: CONSTANT_CONTENT_URI,
  };

  await waitForTx(lensHub.whitelistProfileCreator(user.address, true));
  await waitForTx(lensHub.connect(user).createProfile(createProfileStruct1));
  await waitForTx(lensHub.connect(user).createProfile(createProfileStruct2));
  await waitForTx(lensHub.connect(user).createProfile(createProfileStruct3));

  // users mint 10000 currency
  await waitForTx(currency.mint(user.address, 10000));
  await waitForTx(currency.mint(user2.address, 10000));
  await waitForTx(currency.mint(user3.address, 10000));

  const currencyUser = Currency__factory.connect(currency.address, user);
  await waitForTx(currencyUser.approve(seedModuleAddr, 10000));
  const currencyUser2 = Currency__factory.connect(currency.address, user2);
  await waitForTx(currencyUser2.approve(seedModuleAddr, 10000));
  const currencyUser3 = Currency__factory.connect(currency.address, user3);
  await waitForTx(currencyUser3.approve(seedModuleAddr, 10000));

  // root post
  const createRootPostStruct: PostDataStruct = {
    profileId: 1,
    contentURI: CONSTANT_CONTENT_URI,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: ZERO_ADDRESS,
    referenceModuleInitData: [],
  };
  await waitForTx(lensHub.connect(user).post(createRootPostStruct));

  // user comment
  const createCommentStruct: CommentDataStruct = {
    profileId: 1,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 1,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: CONSTANT_REFERENCE_MODULE,
    referenceModuleInitData: defaultAbiCoder.encode(['address'], [user.address]),
  };
  await waitForTx(lensHub.connect(user).comment(createCommentStruct));

  // user2 comment
  const createCommentStruct2: CommentDataStruct = {
    profileId: 2,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 1,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: CONSTANT_REFERENCE_MODULE,
    referenceModuleInitData: defaultAbiCoder.encode(['address'], [user2.address]),
  };
  await waitForTx(lensHub.connect(user2).comment(createCommentStruct2));

  // user3 comment
  const createCommentStruct3: CommentDataStruct = {
    profileId: 3,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 1,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: CONSTANT_REFERENCE_MODULE,
    referenceModuleInitData: defaultAbiCoder.encode(['address'], [user3.address]),
  };
  await waitForTx(lensHub.connect(user3).comment(createCommentStruct3));
});
