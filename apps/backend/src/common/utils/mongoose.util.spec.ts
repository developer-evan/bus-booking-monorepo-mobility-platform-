import { Types } from 'mongoose';
import { toObjectIdString } from './mongoose.util';

describe('toObjectIdString', () => {
  it('returns string for ObjectId', () => {
    const id = new Types.ObjectId();
    expect(toObjectIdString(id)).toBe(id.toString());
  });

  it('returns _id for populated documents', () => {
    const id = new Types.ObjectId();
    expect(toObjectIdString({ _id: id })).toBe(id.toString());
  });

  it('returns plain id strings unchanged', () => {
    const id = new Types.ObjectId().toString();
    expect(toObjectIdString(id)).toBe(id);
  });
});
