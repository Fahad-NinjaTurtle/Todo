import { ObjectId, type WithoutId } from 'mongodb';
import { getDb } from '@/lib/mongodb';
import type { AppState } from '@/types';

const COLLECTION = 'users';

export interface GoogleEventRef {
  eventId: string;
  hash: string;
}

export interface GoogleConnection {
  refreshToken: string;
  email: string;
  calendarId: string;
  /** Maps app entity keys (task-{id} / reminder-{id}) to Google event ids. */
  eventMap: Record<string, GoogleEventRef>;
}

export interface UserDoc {
  _id: ObjectId;
  email: string;
  passwordHash: string;
  name: string;
  data: AppState;
  google?: GoogleConnection;
  createdAt: Date;
  updatedAt: Date;
}

type UserInsert = WithoutId<UserDoc>;

let indexesReady: Promise<void> | null = null;

function ensureIndexes(): Promise<void> {
  if (!indexesReady) {
    indexesReady = getDb().then(async db => {
      await db.collection(COLLECTION).createIndex({ email: 1 }, { unique: true });
    });
  }
  return indexesReady;
}

async function getUsersCollection() {
  await ensureIndexes();
  const db = await getDb();
  return db.collection<UserDoc>(COLLECTION);
}

export async function findUserByEmail(email: string): Promise<UserDoc | null> {
  const col = await getUsersCollection();
  return col.findOne({ email });
}

export async function findUserById(id: string): Promise<UserDoc | null> {
  if (!ObjectId.isValid(id)) return null;
  const col = await getUsersCollection();
  return col.findOne({ _id: new ObjectId(id) });
}

export async function createUser(input: {
  email: string;
  passwordHash: string;
  name: string;
  data: AppState;
}): Promise<string> {
  const now = new Date();
  const col = await getUsersCollection();
  const doc: UserInsert = {
    email: input.email,
    passwordHash: input.passwordHash,
    name: input.name,
    data: input.data,
    createdAt: now,
    updatedAt: now,
  };
  const result = await col.insertOne(doc as UserDoc);
  return result.insertedId.toString();
}

export async function getUserData(userId: string): Promise<AppState | null> {
  const user = await findUserById(userId);
  return user?.data ?? null;
}

export async function getUserState(
  userId: string
): Promise<{ data: AppState; updatedAt: Date } | null> {
  const user = await findUserById(userId);
  return user ? { data: user.data, updatedAt: user.updatedAt } : null;
}

export async function getGoogleConnection(userId: string): Promise<GoogleConnection | null> {
  const user = await findUserById(userId);
  return user?.google ?? null;
}

export async function saveGoogleConnection(
  userId: string,
  conn: Omit<GoogleConnection, 'eventMap'>
): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user id');
  const col = await getUsersCollection();
  await col.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { google: { ...conn, eventMap: {} } } }
  );
}

export async function updateGoogleEventMap(
  userId: string,
  eventMap: Record<string, GoogleEventRef>
): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user id');
  const col = await getUsersCollection();
  await col.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { 'google.eventMap': eventMap } }
  );
}

export async function clearGoogleConnection(userId: string): Promise<void> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user id');
  const col = await getUsersCollection();
  await col.updateOne({ _id: new ObjectId(userId) }, { $unset: { google: '' } });
}

export async function saveUserData(userId: string, data: AppState): Promise<Date> {
  if (!ObjectId.isValid(userId)) throw new Error('Invalid user id');
  const col = await getUsersCollection();
  const updatedAt = new Date();
  await col.updateOne(
    { _id: new ObjectId(userId) },
    { $set: { data, updatedAt } }
  );
  return updatedAt;
}
