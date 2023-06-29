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

task('seed-noevent', 'add more post').setAction(async (_, hre) => {
  const [governance, treasury, user, relayer, admin, user2, user3] = await initEnv(hre);
  const addrs = getAddrs();
  const lensHub = LensHub__factory.connect(addrs['lensHub proxy'], governance);

  // user comment
  const createCommentStruct: CommentDataStruct = {
    profileId: 1,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 2,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: ZERO_ADDRESS,
    referenceModuleInitData: [],
  };
  await waitForTx(lensHub.connect(user).comment(createCommentStruct));

  // user2 comment
  const createCommentStruct2: CommentDataStruct = {
    profileId: 2,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 2,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: ZERO_ADDRESS,
    referenceModuleInitData: [],
  };
  await waitForTx(lensHub.connect(user2).comment(createCommentStruct2));

  // user3 comment
  const createCommentStruct3: CommentDataStruct = {
    profileId: 3,
    contentURI: CONSTANT_CONTENT_URI,
    profileIdPointed: 2,
    pubIdPointed: 1,
    referenceModuleData: CONSTANT_REFERENCE_MODULE_DATA,
    collectModule: CONSTANT_COLLECT_MODULE,
    collectModuleInitData: CONSTANT_COLLECT_MODULE_INIT_DATA,
    referenceModule: ZERO_ADDRESS,
    referenceModuleInitData: [],
  };
  await waitForTx(lensHub.connect(user3).comment(createCommentStruct3));
});
