import { encode, decode } from '@msgpack/msgpack';

export function pack(obj) {
  return encode(obj);
}

export function unpack(buf) {
  return decode(buf);
}