import { customAlphabet } from 'nanoid';

const alphaNum = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);

export const makeClothCode = () => `C-${alphaNum()}`;
