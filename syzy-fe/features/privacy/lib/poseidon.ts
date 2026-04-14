import { poseidon2, poseidon3, poseidon4 } from "poseidon-lite";

export const hash4 = (inputs: [bigint, bigint, bigint, bigint]): bigint => {
  return poseidon4(inputs);
};

export const hash3 = (inputs: [bigint, bigint, bigint]): bigint => {
  return poseidon3(inputs);
};

export const hash2 = (inputs: [bigint, bigint]): bigint => {
  return poseidon2(inputs);
};
