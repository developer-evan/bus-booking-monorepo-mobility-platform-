import { Types } from 'mongoose';

type ObjectIdLike =
  | Types.ObjectId
  | string
  | { _id?: Types.ObjectId | string };

export function toObjectIdString(value: ObjectIdLike): string {
  if (value instanceof Types.ObjectId) {
    return value.toString();
  }

  if (typeof value === 'string') {
    return value;
  }

  if (value._id instanceof Types.ObjectId) {
    return value._id.toString();
  }

  if (typeof value._id === 'string') {
    return value._id;
  }

  throw new Error('Unable to resolve ObjectId reference');
}

export function emptyStringToUndefined(value: unknown): unknown {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}
