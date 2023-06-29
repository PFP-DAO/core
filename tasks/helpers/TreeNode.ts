import { defaultAbiCoder } from 'ethers/lib/utils';
import { ZERO_ADDRESS, getAddrs } from './utils';

export default class TreeNode<
  T extends {
    profileId: number;
    profileIdPointed: number;
    pubIdPointed: number;
  }
> {
  index: number;
  value: T;
  children: TreeNode<T>[];

  constructor(index: number, value: T) {
    this.index = index;
    this.value = value;
    this.children = [];
  }

  addChild(child: TreeNode<T>): void {
    this.children.push(child);
  }

  getTotalChildCountByIndex(index: number): number {
    let count = 0;

    if (this.index === index) {
      count += this.children.length;
    }

    for (const child of this.children) {
      count += child.getTotalChildCountByIndex(index);
    }

    return count;
  }

  getTopThreeChildCountsByIndex(index: number): [TreeNode<T>, number][] {
    const childCounts: [TreeNode<T>, number][] = [];

    if (this.index === index) {
      for (const child of this.children) {
        const count = child.getTotalChildCountByIndex(child.index);
        childCounts.push([child, count]);
      }
    }

    childCounts.sort((a, b) => b[1] - a[1]);
    return childCounts.slice(0, 3);
  }
}

const addrs = getAddrs();
const freeCollectModuleAddr = addrs['free collect module'];
export const CONSTANT_CONTENT_URI =
  'https://ipfs.io/ipfs/Qmby8QocUU2sPZL46rZeMctAuF5nrCc7eR1PPkooCztWPz';

export const CONSTANT_REFERENCE_MODULE_DATA = [];
export const CONSTANT_COLLECT_MODULE = freeCollectModuleAddr;
export const CONSTANT_COLLECT_MODULE_INIT_DATA = defaultAbiCoder.encode(['bool'], [true]);
export const CONSTANT_REFERENCE_MODULE = addrs['seed module'];
export const CONSTANT_REFERENCE_MODULE_INIT_DATA = [];
